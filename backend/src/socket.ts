import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma.js";
import { env } from "./config/env.js";

// ─── Конфиг ──────────────────────────────────────────────

const JWT_SECRET = env.JWT_SECRET;

// ─── Типы ────────────────────────────────────────────────

interface JwtPayload {
  userId: string;
  telegramId: string;
}

interface QueueEntry {
  socketId: string;
  userId: string;
  targetGender: string;
  topic: string;
}

// Расширяем типизацию socket.data через SocketData
declare module "socket.io" {
  interface SocketData {
    userId?: string;
    telegramId?: string;
  }
}

// ─── Онлайн-пользователи ─────────────────────────────────

/** Map<userId, socketId> — реестр подключённых пользователей */
const onlineUsers = new Map<string, string>();

// ─── AnonQueueManager — очередь поиска анонимного чата ───

class AnonQueueManager {
  private queue: QueueEntry[] = [];

  /** Добавить пользователя в очередь */
  add(entry: QueueEntry): void {
    // Не допускаем дублирования
    this.remove(entry.userId);
    this.queue.push(entry);
  }

  /** Удалить пользователя из очереди */
  remove(userId: string): void {
    this.queue = this.queue.filter((e) => e.userId !== userId);
  }

  /** Удалить по socketId */
  removeBySocket(socketId: string): void {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  /**
   * Попытаться найти пару для пользователя.
   * Совместимость: targetGender должен совпадать с полом кандидата
   * (или быть "all"), и темы должны пересекаться.
   * Возвращает пару { entry, candidate } или null.
   */
  findMatch(
    entry: QueueEntry,
    getGender: (userId: string) => Promise<string | null>
  ): { entry: QueueEntry; candidate: QueueEntry } | null {
    // Простая стратегия: ищем первого подходящего
    for (const candidate of this.queue) {
      if (candidate.userId === entry.userId) continue;

      // Проверяем совместимость тем
      const topicsMatch = entry.topic === candidate.topic;
      if (!topicsMatch) continue;

      // TODO: проверить targetGender через getGender
      // Пока используем простое сравнение — оба должны хотеть
      // пол друг друга или "all"
      return { entry, candidate };
    }
    return null;
  }

  get size(): number {
    return this.queue.length;
  }
}

// ─── Инициализация Socket.io ─────────────────────────────

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  const anonQueue = new AnonQueueManager();

  // ─── JWT Middleware для сокетов ───────────────────────────

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Токен не предоставлен"));
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      socket.data.userId = payload.userId;
      socket.data.telegramId = payload.telegramId;
      next();
    } catch {
      next(new Error("Недействительный токен"));
    }
  });

  // ─── Подключение ────────────────────────────────────────

  io.on("connection", (socket) => {
    const userId = socket.data.userId!;
    console.log(`[socket] Пользователь подключился: ${userId} (${socket.id})`);

    // Регистрируем онлайн-пользователя
    onlineUsers.set(userId, socket.id);

    // ═══════════════════════════════════════════════════════
    //  ДЕЙТИНГ-ЧАТ (Dating Chat)
    // ═══════════════════════════════════════════════════════

    /** Присоединение к комнате мэтча */
    socket.on("join_chat", async ({ matchId }: { matchId: string }) => {
      if (!matchId) return;

      // Проверяем, что пользователь является участником мэтча
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!match) {
        socket.emit("error_message", {
          error: "Мэтч не найден или нет доступа",
        });
        return;
      }

      const room = `match:${matchId}`;
      socket.join(room);
      console.log(`[socket] ${userId} присоединился к ${room}`);
    });

    /** Отправка сообщения в мэтч-чат */
    socket.on(
      "send_message",
      async (data: {
        matchId: string;
        text?: string;
        attachments?: string[];
        audioUrl?: string;
        duration?: number;
      }) => {
        const { matchId, text, attachments, audioUrl, duration } = data;

        if (!matchId) return;

        // Проверяем доступ к мэтчу
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
        });

        if (!match) {
          socket.emit("error_message", { error: "Мэтч не найден" });
          return;
        }

        // Сохраняем сообщение в БД
        const message = await prisma.message.create({
          data: {
            matchId,
            senderId: userId,
            text: text ?? null,
            attachments: attachments ?? [],
            audioUrl: audioUrl ?? null,
            duration: duration ?? null,
          },
          include: {
            sender: {
              select: { id: true, name: true, photos: true },
            },
          },
        });

        const room = `match:${matchId}`;
        const payload = {
          id: message.id,
          matchId: message.matchId,
          senderId: message.senderId,
          senderName: message.sender.name,
          text: message.text,
          attachments: message.attachments,
          audioUrl: message.audioUrl,
          duration: message.duration,
          createdAt: message.createdAt.toISOString(),
        };

        // Рассылаем всем в комнате (включая отправителя)
        io.to(room).emit("new_message", payload);
      }
    );

    /** Индикатор набора текста — начало */
    socket.on("typing_start", ({ matchId }: { matchId: string }) => {
      if (!matchId) return;
      const room = `match:${matchId}`;
      socket.to(room).emit("typing_start", { matchId, userId });
    });

    /** Индикатор набора текста — конец */
    socket.on("typing_stop", ({ matchId }: { matchId: string }) => {
      if (!matchId) return;
      const room = `match:${matchId}`;
      socket.to(room).emit("typing_stop", { matchId, userId });
    });

    // ═══════════════════════════════════════════════════════
    //  АНОНИМНЫЙ ЧАТ (Anonymous Chat Queue)
    // ═══════════════════════════════════════════════════════

    /** Начать поиск собеседника */
    socket.on(
      "start_anon_search",
      async (data: { targetGender: string; topic: string }) => {
        const { targetGender, topic } = data;

        if (!targetGender || !topic) {
          socket.emit("error_message", {
            error: "targetGender и topic обязательны",
          });
          return;
        }

        console.log(
          `[anon] ${userId} ищет: gender=${targetGender}, topic=${topic}`
        );

        const entry: QueueEntry = {
          socketId: socket.id,
          userId,
          targetGender,
          topic,
        };

        // Попытка найти пару
        const match = anonQueue.findMatch(entry, async (uid) => {
          const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { gender: true },
          });
          return user?.gender ?? null;
        });

        if (match) {
          // Удаляем найденного кандидата из очереди
          anonQueue.remove(match.candidate.userId);

          // Создаём анонимную сессию в БД
          const session = await prisma.anonSession.create({
            data: {
              user1Id: match.entry.userId,
              user2Id: match.candidate.userId,
              topic,
              status: "ACTIVE",
            },
          });

          const sessionId = session.id;
          const room = `anon:${sessionId}`;

          // Присоединяем оба сокета к комнате
          const candidateSocket = io.sockets.sockets.get(
            match.candidate.socketId
          );

          socket.join(room);
          candidateSocket?.join(room);

          // Получаем информацию о партнёрах (имя, возраст)
          const [user1, user2] = await Promise.all([
            prisma.user.findUnique({
              where: { id: match.entry.userId },
              select: { id: true, name: true, age: true, gender: true },
            }),
            prisma.user.findUnique({
              where: { id: match.candidate.userId },
              select: { id: true, name: true, age: true, gender: true },
            }),
          ]);

          // Уведомляем обоих
          socket.emit("anon_match_found", {
            sessionId,
            partnerInfo: user2
              ? {
                  id: user2.id,
                  name: user2.name,
                  age: user2.age,
                  gender: user2.gender,
                }
              : null,
          });

          candidateSocket?.emit("anon_match_found", {
            sessionId,
            partnerInfo: user1
              ? {
                  id: user1.id,
                  name: user1.name,
                  age: user1.age,
                  gender: user1.gender,
                }
              : null,
          });

          console.log(
            `[anon] Мэтч: ${match.entry.userId} <-> ${match.candidate.userId} (${sessionId})`
          );
        } else {
          // Нет пары — добавляем в очередь
          anonQueue.add(entry);
          socket.emit("anon_search_queued", { position: anonQueue.size });
          console.log(`[anon] ${userId} добавлен в очередь (${anonQueue.size})`);
        }
      }
    );

    /** Отменить поиск */
    socket.on("cancel_anon_search", () => {
      anonQueue.remove(userId);
      socket.emit("anon_search_cancelled");
      console.log(`[anon] ${userId} отменил поиск`);
    });

    /** Отправка сообщения в анонимный чат */
    socket.on(
      "send_anon_message",
      async (data: {
        sessionId: string;
        text?: string;
        attachments?: string[];
        audioUrl?: string;
        duration?: number;
      }) => {
        const { sessionId, text, attachments, audioUrl, duration } = data;

        if (!sessionId) return;

        // Проверяем, что сессия активна и пользователь — участник
        const session = await prisma.anonSession.findFirst({
          where: {
            id: sessionId,
            status: "ACTIVE",
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
        });

        if (!session) {
          socket.emit("error_message", {
            error: "Анонимная сессия не найдена или закрыта",
          });
          return;
        }

        // Сохраняем сообщение в таблицу AnonMessage
        const anonMessage = await prisma.anonMessage.create({
          data: {
            sessionId,
            senderId: userId,
            text: text ?? null,
            attachments: attachments ?? [],
            audioUrl: audioUrl ?? null,
            duration: duration ?? null,
          },
        });

        const room = `anon:${sessionId}`;
        const payload = {
          id: anonMessage.id,
          sessionId,
          senderId: userId,
          text: anonMessage.text,
          attachments: anonMessage.attachments,
          audioUrl: anonMessage.audioUrl,
          duration: anonMessage.duration,
          createdAt: anonMessage.createdAt.toISOString(),
        };

        io.to(room).emit("new_anon_message", payload);
      }
    );

    /** Покинуть анонимный чат */
    socket.on(
      "leave_anon_chat",
      async ({ sessionId }: { sessionId: string }) => {
        if (!sessionId) return;

        // Закрываем сессию
        const session = await prisma.anonSession.findFirst({
          where: {
            id: sessionId,
            status: "ACTIVE",
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
        });

        if (!session) return;

        await prisma.anonSession.update({
          where: { id: sessionId },
          data: { status: "CLOSED" },
        });

        const room = `anon:${sessionId}`;

        // Уведомляем партнёра
        socket.to(room).emit("anon_partner_left", { sessionId });

        // Покидаем комнату
        socket.leave(room);

        console.log(
          `[anon] ${userId} покинул сессию ${sessionId}`
        );
      }
    );

    // ═══════════════════════════════════════════════════════
    //  Отключение
    // ═══════════════════════════════════════════════════════

    socket.on("disconnect", () => {
      console.log(`[socket] Пользователь отключился: ${userId} (${socket.id})`);

      // Удаляем из онлайн-реестра
      onlineUsers.delete(userId);

      // Удаляем из очереди анонимного чата
      anonQueue.removeBySocket(socket.id);
    });
  });

  console.log("[socket] Socket.io инициализирован");
  return io;
}

export { onlineUsers };
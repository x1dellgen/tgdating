import { Router } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

// ─── GET /api/matches/likes — входящие лайки ──────────────

router.get("/likes", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;

    const likes = await prisma.like.findMany({
      where: {
        toUserId: userId,
        type: { in: ["LIKE", "SUPERLIKE"] },
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            age: true,
            city: true,
            photos: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = likes.map((like: (typeof likes)[number]) => ({
      id: like.id,
      type: like.type,
      message: like.message,
      createdAt: like.createdAt.toISOString(),
      user: {
        id: like.fromUser.id,
        name: like.fromUser.name,
        age: like.fromUser.age,
        city: like.fromUser.city,
        photos: like.fromUser.photos,
        bio: like.fromUser.bio,
      },
    }));

    res.json({ likes: result });
  } catch (error) {
    console.error("[matches] GET /likes error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── GET /api/matches — активные мэтчи ────────────────────

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            age: true,
            city: true,
            photos: true,
            bio: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            age: true,
            city: true,
            photos: true,
            bio: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            senderId: true,
            audioUrl: true,
            attachments: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = matches.map((m: (typeof matches)[number]) => {
      const partner = m.user1Id === userId ? m.user2 : m.user1;
      const lastMessage = m.messages[0] ?? null;

      return {
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        partner: {
          id: partner.id,
          name: partner.name,
          age: partner.age,
          city: partner.city,
          photos: partner.photos,
          bio: partner.bio,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              audioUrl: lastMessage.audioUrl,
              attachments: lastMessage.attachments,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
      };
    });

    res.json({ matches: result });
  } catch (error) {
    console.error("[matches] GET / error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── GET /api/matches/:matchId/messages — история сообщений ──

router.get("/:matchId/messages", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const matchId = String(req.params.matchId);
    const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    // Проверяем, что пользователь — участник мэтча
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!match) {
      res.status(404).json({ error: "Мэтч не найден" });
      return;
    }

    // Загружаем сообщения с пагинацией (cursor-based)
    const messages = await prisma.message.findMany({
      where: {
        matchId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true, photos: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result = messages.map((msg: (typeof messages)[number]) => ({
      id: msg.id,
      matchId: msg.matchId,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      text: msg.text,
      attachments: msg.attachments,
      audioUrl: msg.audioUrl,
      duration: msg.duration,
      createdAt: msg.createdAt.toISOString(),
    }));

    res.json({
      messages: result,
      nextCursor:
        messages.length === limit
          ? messages[messages.length - 1]!.createdAt.toISOString()
          : null,
    });
  } catch (error) {
    console.error("[matches] GET /:matchId/messages error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

export default router;

import { Router } from "express";
import prisma from "../lib/prisma.js";
import { validate } from "../middleware/validate.middleware.js";
import { matchMessagesSchema } from "../schemas/match.schema.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

// ─── GET /api/matches/likes — входящие лайки ──────────────

/**
 * @openapi
 * /api/matches/likes:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Входящие лайки
 *     description: Возвращает список входящих лайков и суперлайков от других пользователей.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список входящих лайков
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 likes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       type:
 *                         type: string
 *                         enum: [LIKE, SUPERLIKE]
 *                       message:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           city:
 *                             type: string
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                           bio:
 *                             type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /api/matches:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Список активных мэтчей
 *     description: >
 *       Возвращает все мэтчи текущего пользователя с данными партнёра
 *       и последним сообщением (если есть).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список мэтчей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       partner:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           city:
 *                             type: string
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                           bio:
 *                             type: string
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           text:
 *                             type: string
 *                           senderId:
 *                             type: string
 *                             format: uuid
 *                           audioUrl:
 *                             type: string
 *                             nullable: true
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

router.get(
  "/:matchId/messages",
  validate(matchMessagesSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const matchId = String(req.params.matchId);
      const { limit, cursor } = req.query as unknown as {
        limit: number;
        cursor?: string;
      };

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

      const result = messages.map((msg) => ({
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
  }
);

export default router;

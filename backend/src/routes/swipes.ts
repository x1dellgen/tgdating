import { Router } from "express";
import prisma from "../lib/prisma.js";
import { validate } from "../middleware/validate.middleware.js";
import { likeSchema, feedQuerySchema } from "../schemas/swipe.schema.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

// ─── GET /api/swipes/feed — лента анкет ───────────────────

/**
 * @openapi
 * /api/swipes/feed:
 *   get:
 *     tags:
 *       - Swipes
 *     summary: Лента анкет
 *     description: >
 *       Возвращает список профилей для свайпа. Исключает уже лайкнутых
 *       пользователей и самого себя. Поддерживает фильтрацию по полу и возрасту.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Количество профилей
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female]
 *         description: Фильтр по полу
 *       - in: query
 *         name: ageFrom
 *         schema:
 *           type: integer
 *           minimum: 18
 *           maximum: 99
 *         description: Минимальный возраст
 *       - in: query
 *         name: ageTo
 *         schema:
 *           type: integer
 *           minimum: 18
 *           maximum: 99
 *         description: Максимальный возраст
 *     responses:
 *       200:
 *         description: Список профилей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       age:
 *                         type: integer
 *                       city:
 *                         type: string
 *                       gender:
 *                         type: string
 *                       bio:
 *                         type: string
 *                       photos:
 *                         type: array
 *                         items:
 *                           type: string
 *                       purpose:
 *                         type: string
 *                       interests:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/feed",
  validate(feedQuerySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { limit, gender: genderPref, ageFrom, ageTo } = req.query as unknown as {
        limit: number;
        gender?: string;
        ageFrom?: number;
        ageTo?: number;
      };

      // Получаем ID пользователей, которых текущий уже лайкнул / заблокировал
      const existingLikes = await prisma.like.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      });
      const excludedIds = existingLikes.map((l: { toUserId: string }) => l.toUserId);
      excludedIds.push(userId); // Исключаем себя

      // Базовый фильтр
      const where: Record<string, unknown> = {
        id: { notIn: excludedIds },
        hasProfile: true,
      };

      // Фильтр по полу
      if (genderPref) {
        where.gender = genderPref;
      }

      // Фильтр по возрасту
      if (ageFrom !== undefined || ageTo !== undefined) {
        where.age = {} as Record<string, number>;
        if (ageFrom !== undefined) (where.age as Record<string, number>).gte = ageFrom;
        if (ageTo !== undefined) (where.age as Record<string, number>).lte = ageTo;
      }

      const users = await prisma.user.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          age: true,
          city: true,
          gender: true,
          bio: true,
          photos: true,
          purpose: true,
          interests: true,
        },
      });

      res.json({ profiles: users });
    } catch (error) {
      console.error("[swipes] GET /feed error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
);

// ─── POST /api/swipes/like — поставить лайк / дизлайк ────

/**
 * @openapi
 * /api/swipes/like:
 *   post:
 *     tags:
 *       - Swipes
 *     summary: Поставить лайк / дизлайк / суперлайк
 *     description: >
 *       Отправляет лайк, дизлайк или суперлайк другому пользователю.
 *       Если оба пользователя лайкнули друг друга — автоматически создаётся мэтч.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - type
 *             properties:
 *               toUserId:
 *                 type: string
 *                 format: uuid
 *                 description: ID целевого пользователя
 *               type:
 *                 type: string
 *                 enum: [LIKE, DISLIKE, SUPERLIKE]
 *                 description: Тип реакции
 *               message:
 *                 type: string
 *                 maxLength: 200
 *                 description: Необязательное сообщение (для суперлайка)
 *                 example: "Привет! Тоже любишь горы?"
 *     responses:
 *       200:
 *         description: Результат лайка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 like:
 *                   type: object
 *                   description: Созданный/обновлённый лайк
 *                 isMatch:
 *                   type: boolean
 *                   description: Создан ли мэтч
 *                 matchData:
 *                   type: object
 *                   nullable: true
 *                   description: Данные мэтча (если создан)
 *       400:
 *         description: Нельзя лайкнуть себя / ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/like",
  validate(likeSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const fromUserId = req.userId!;
      const { toUserId, type, message } = req.body;

      if (toUserId === fromUserId) {
        res.status(400).json({ error: "Нельзя лайкнуть себя" });
        return;
      }

      // Проверяем, существует ли целевой пользователь
      const targetUser = await prisma.user.findUnique({
        where: { id: toUserId },
      });
      if (!targetUser) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }

      // Сохраняем лайк (upsert, чтобы избежать дубликатов)
      const like = await prisma.like.upsert({
        where: {
          fromUserId_toUserId: { fromUserId, toUserId },
        },
        update: { type, message: message ?? null },
        create: { fromUserId, toUserId, type, message: message ?? null },
      });

      // Проверяем взаимность (только для LIKE и SUPERLIKE)
      let isMatch = false;
      let matchData = null;

      if (type === "LIKE" || type === "SUPERLIKE") {
        const reciprocal = await prisma.like.findFirst({
          where: {
            fromUserId: toUserId,
            toUserId: fromUserId,
            type: { in: ["LIKE", "SUPERLIKE"] },
          },
        });

        if (reciprocal) {
          // Упорядочиваем user1Id < user2Id для уникальности
          const [user1Id, user2Id] =
            fromUserId < toUserId
              ? [fromUserId, toUserId]
              : [toUserId, fromUserId];

          const match = await prisma.match.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            update: {},
            create: { user1Id, user2Id },
            include: {
              user1: { select: { id: true, name: true, photos: true } },
              user2: { select: { id: true, name: true, photos: true } },
            },
          });

          isMatch = true;
          matchData = match;
        }
      }

      res.json({ like, isMatch, matchData });
    } catch (error) {
      console.error("[swipes] POST /like error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
);

export default router;
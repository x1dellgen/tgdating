import { Router } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { LikeType } from "@prisma/client";

const router = Router();

// ─── GET /api/swipes/feed — лента анкет ───────────────────

router.get("/feed", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const genderPref = req.query.gender as string | undefined;
    const ageFrom = req.query.ageFrom ? Number(req.query.ageFrom) : undefined;
    const ageTo = req.query.ageTo ? Number(req.query.ageTo) : undefined;

    // Получаем ID пользователей, которых текущий уже лайкнул / заблокировал
    const existingLikes = await prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const excludedIds = existingLikes.map((l: { toUserId: string }) => l.toUserId);
    excludedIds.push(userId); // Исключаем себя

    // Базовый фильтр
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      id: { notIn: excludedIds },
      hasProfile: true,
    };

    // Фильтр по полу (targetGender на анкете означает, кого ищет,
    // а gender — свой пол. Фильтруем по совпадению предпочтений)
    if (genderPref) {
      where.gender = genderPref;
    }

    // Фильтр по возрасту
    if (ageFrom !== undefined || ageTo !== undefined) {
      where.age = {};
      if (ageFrom !== undefined) where.age.gte = ageFrom;
      if (ageTo !== undefined) where.age.lte = ageTo;
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
});

// ─── POST /api/swipes/like — поставить лайк / дизлайк ────

router.post("/like", async (req: AuthenticatedRequest, res) => {
  try {
    const fromUserId = req.userId!;
    const { toUserId, type, message } = req.body as {
      toUserId?: string;
      type?: LikeType;
      message?: string;
    };

    if (!toUserId || !type) {
      res.status(400).json({ error: "toUserId и type обязательны" });
      return;
    }

    if (!["LIKE", "DISLIKE", "SUPERLIKE"].includes(type)) {
      res.status(400).json({ error: "Недопустимый тип лайка" });
      return;
    }

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
});

export default router;
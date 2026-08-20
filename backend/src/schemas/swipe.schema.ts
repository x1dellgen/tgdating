import { z } from "zod";

/**
 * Схемы валидации для эндпоинтов /api/swipes
 */

// ─── POST /api/swipes/like ──────────────────────────────────

export const likeSchema = {
  body: z.object({
    toUserId: z.string().uuid("toUserId должен быть UUID"),
    type: z.enum(["LIKE", "DISLIKE", "SUPERLIKE"], {
      message: "type должен быть LIKE, DISLIKE или SUPERLIKE",
    }),
    message: z.string().trim().max(200, "Сообщение не может превышать 200 символов").optional(),
  }),
};

// ─── GET /api/swipes/feed ───────────────────────────────────

export const feedQuerySchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    gender: z.enum(["male", "female"]).optional(),
    ageFrom: z.coerce.number().int().min(18).max(99).optional(),
    ageTo: z.coerce.number().int().min(18).max(99).optional(),
  }),
};

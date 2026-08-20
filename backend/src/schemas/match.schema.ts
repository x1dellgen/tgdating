import { z } from "zod";

/**
 * Схемы валидации для эндпоинтов /api/matches
 */

// ─── GET /api/matches/:matchId/messages ─────────────────────

export const matchMessagesSchema = {
  params: z.object({
    matchId: z.string().uuid("matchId должен быть UUID"),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().datetime({ message: "cursor должен быть ISO-датой" }).optional(),
  }),
};

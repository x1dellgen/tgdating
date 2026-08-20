import { z } from "zod";

/**
 * Схемы валидации для эндпоинтов /api/users
 */

// ─── PUT /api/users/me ─────────────────────────────────────

export const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(1, "Имя обязательно").max(50, "Имя слишком длинное").optional(),
    age: z.coerce.number().int().min(18, "Минимальный возраст — 18").max(99, "Максимальный возраст — 99").optional(),
    city: z.string().trim().max(50, "Название города слишком длинное").optional(),
    gender: z.enum(["male", "female"], { message: "Пол должен быть male или female" }).optional(),
    targetGender: z.enum(["male", "female", "all"], { message: "targetGender должен быть male, female или all" }).optional(),
    bio: z.string().trim().max(500, "Био не может превышать 500 символов").optional(),
    purpose: z.string().trim().max(50, "Цель слишком длинная").optional(),
    interests: z.array(z.string().trim().min(1)).max(10, "Максимум 10 интересов").optional(),
    hasProfile: z.boolean().optional(),
  }),
};

// ─── DELETE /api/users/me/photos ────────────────────────────

export const deletePhotoSchema = {
  body: z.object({
    url: z
      .string()
      .min(1, "url фотографии обязателен")
      .refine(
        (val) => val.startsWith("/uploads/") || val.startsWith("http"),
        "url должен начинаться с /uploads/ или быть полным URL"
      ),
  }),
};

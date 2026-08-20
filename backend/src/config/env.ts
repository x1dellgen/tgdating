import { z } from "zod";

/**
 * Fail-fast валидация переменных окружения.
 * Сервер падает сразу при старте, если критичные переменные не заданы.
 */

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен"),
  DIRECT_URL: z.string().optional(),
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN обязателен"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET должен быть не менее 32 символов"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Ошибка валидации переменных окружения:\n",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;

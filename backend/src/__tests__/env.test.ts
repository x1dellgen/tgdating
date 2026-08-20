import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Тесты Zod-схемы валидации переменных окружения.
 * Схема зеркалит env.ts — проверяем логику валидации
 * без импорта модуля (чтобы не вызывать process.exit).
 */

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен"),
  DIRECT_URL: z.string().optional(),
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN обязателен"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET должен быть не менее 10 символов"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// ─── Тесты ──────────────────────────────────────────────

describe("env schema validation", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    BOT_TOKEN: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    JWT_SECRET: "super-secret-jwt-key-minimum-10-chars",
  };

  it("accepts valid environment variables", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    }
  });

  it("rejects missing BOT_TOKEN", () => {
    const { BOT_TOKEN: _, ...envWithoutToken } = validEnv;
    const result = envSchema.safeParse(envWithoutToken);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("BOT_TOKEN")
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects empty BOT_TOKEN", () => {
    const result = envSchema.safeParse({ ...validEnv, BOT_TOKEN: "" });
    expect(result.success).toBe(false);
  });

  it("rejects short JWT_SECRET (< 10 characters)", () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("JWT_SECRET")
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe(
        "JWT_SECRET должен быть не менее 10 символов"
      );
    }
  });

  it("rejects missing JWT_SECRET", () => {
    const { JWT_SECRET: _, ...envWithoutSecret } = validEnv;
    const result = envSchema.safeParse(envWithoutSecret);
    expect(result.success).toBe(false);
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _, ...envWithoutDb } = validEnv;
    const result = envSchema.safeParse(envWithoutDb);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("DATABASE_URL")
      );
      expect(issue).toBeDefined();
    }
  });

  it("applies default PORT when not provided", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
    }
  });

  it("rejects invalid NODE_ENV", () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "staging" });
    expect(result.success).toBe(false);
  });
});

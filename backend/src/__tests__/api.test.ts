import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Моки (Vitest hoist-ит vi.mock до импортов) ─────────

// Мокаем env-модуль: предотвращает process.exit и даёт валидные значения
vi.mock("../config/env.js", () => ({
  env: {
    PORT: 5000,
    DATABASE_URL: "postgresql://localhost:5432/test",
    BOT_TOKEN: "123456:ABC-DEF123456",
    JWT_SECRET: "test-jwt-secret-key-at-least-10",
    NODE_ENV: "test",
  },
}));

// Мокаем Prisma — не нужна реальная БД
vi.mock("../lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    match: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}));

// Мокаем Socket.io — не нужен WebSocket в тестах
vi.mock("../socket.js", () => ({
  initSocket: vi.fn(),
}));

// Мокаем node:http — предотвращаем реальный server.listen()
vi.mock("node:http", () => ({
  createServer: vi.fn(() => ({
    listen: vi.fn((_port: number, cb?: () => void) => {
      if (cb) cb();
    }),
    close: vi.fn(),
  })),
}));

// Мокаем dotenv — не загружаем реальный .env
vi.mock("dotenv/config", () => ({}));

// ─── Импорт приложения ПОСЛЕ моков ──────────────────────

import app from "../server.js";

// ─── Утилиты ────────────────────────────────────────────

const JWT_SECRET = "test-jwt-secret-key-at-least-10";

function generateToken(
  userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  telegramId = "12345"
): string {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, { expiresIn: "30d" });
}

// ─── Тесты ──────────────────────────────────────────────

describe("API Integration Tests", () => {
  // ─── Health check ─────────────────────────────────────

  describe("GET /api/health", () => {
    it("returns 200 OK with status ok", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeDefined();
      expect(typeof res.body.uptime).toBe("number");
    });
  });

  // ─── Защита роутов без токена ────────────────────────

  describe("Protected routes without Authorization", () => {
    it("PUT /api/users/me returns 401 without token", async () => {
      const res = await request(app)
        .put("/api/users/me")
        .send({ name: "Test" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("GET /api/users/me returns 401 without token", async () => {
      const res = await request(app).get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("POST /api/swipes/like returns 401 without token", async () => {
      const res = await request(app)
        .post("/api/swipes/like")
        .send({ toUserId: "550e8400-e29b-41d4-a716-446655440000", type: "LIKE" });

      expect(res.status).toBe(401);
    });
  });

  // ─── Валидация body через Zod ────────────────────────

  describe("PUT /api/users/me with invalid body", () => {
    it("returns 400 with Zod errors for age < 18", async () => {
      const token = generateToken();

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ age: 15 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Ошибка валидации");
      expect(res.body.details).toBeDefined();
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThan(0);

      const ageError = res.body.details.find((d: { path: string }) =>
        d.path.includes("age")
      );
      expect(ageError).toBeDefined();
    });

    it("returns 400 with Zod errors for invalid gender", async () => {
      const token = generateToken();

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ gender: "other" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Ошибка валидации");
      expect(res.body.details).toBeDefined();

      const genderError = res.body.details.find((d: { path: string }) =>
        d.path.includes("gender")
      );
      expect(genderError).toBeDefined();
    });

    it("returns 400 with Zod errors for name too long", async () => {
      const token = generateToken();

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "А".repeat(51) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Ошибка валидации");
    });
  });
});

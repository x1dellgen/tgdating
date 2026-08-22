import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Моки (Vitest hoist-ит vi.mock до импортов) ─────────

vi.mock("../config/env.js", () => ({
  env: {
    PORT: 5000,
    DATABASE_URL: "postgresql://localhost:5432/test",
    BOT_TOKEN: "123456:ABC-DEF123456",
    JWT_SECRET: "test-jwt-secret-key-at-least-32-chars-long",
    NODE_ENV: "test",
  },
}));

vi.mock("../lib/prisma.js", () => ({
  default: {
    match: { findFirst: vi.fn() },
    message: { create: vi.fn() },
    anonSession: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    anonMessage: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("dotenv/config", () => ({}));

// ─── Импорты ПОСЛЕ моков ─────────────────────────────────

import {
  sendMessageSchema,
  sendAnonMessageSchema,
  joinChatSchema,
  startAnonSearchSchema,
  leaveAnonChatSchema,
  typingSchema,
} from "../schemas/socket.schema.js";
import { SocketRateLimiter } from "../lib/socket-rate-limiter.js";

// ─── Утилиты ─────────────────────────────────────────────

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ═══════════════════════════════════════════════════════════
//  Zod-схемы: валидация send_message
// ═══════════════════════════════════════════════════════════

describe("sendMessageSchema", () => {
  it("accepts valid text message", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: "Привет!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid message with attachments", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      attachments: ["https://example.com/photo.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid audio message", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      audioUrl: "https://example.com/audio.ogg",
      duration: 30,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing matchId", () => {
    const result = sendMessageSchema.safeParse({ text: "hello" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid matchId (not UUID)", () => {
    const result = sendMessageSchema.safeParse({
      matchId: "not-a-uuid",
      text: "hello",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("matchId")
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects empty message (no text, no attachments, no audio)", () => {
    const result = sendMessageSchema.safeParse({ matchId: VALID_UUID });
    expect(result.success).toBe(false);
  });

  it("rejects text exceeding max length", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts text at max length (1000)", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: "x".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects too many attachments", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      attachments: Array.from({ length: 11 }, (_, i) => `https://ex.com/${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts max attachments (10)", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      attachments: Array.from({ length: 10 }, (_, i) => `https://ex.com/${i}`),
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative duration", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      audioUrl: "https://example.com/audio.ogg",
      duration: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration exceeding max (600s)", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      audioUrl: "https://example.com/audio.ogg",
      duration: 601,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer duration", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      audioUrl: "https://example.com/audio.ogg",
      duration: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-object data", () => {
    const result = sendMessageSchema.safeParse("just a string");
    expect(result.success).toBe(false);
  });

  it("rejects null data", () => {
    const result = sendMessageSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  Zod-схемы: валидация send_anon_message
// ═══════════════════════════════════════════════════════════

describe("sendAnonMessageSchema", () => {
  it("accepts valid text message", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
      text: "Анонимное сообщение",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid audio message", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
      audioUrl: "https://example.com/audio.ogg",
      duration: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sessionId (not UUID)", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: "not-a-uuid",
      text: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects text exceeding max length", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
      text: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  Zod-схемы: валидация join_chat
// ═══════════════════════════════════════════════════════════

describe("joinChatSchema", () => {
  it("accepts valid matchId", () => {
    const result = joinChatSchema.safeParse({ matchId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid matchId", () => {
    const result = joinChatSchema.safeParse({ matchId: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing matchId", () => {
    const result = joinChatSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  Zod-схемы: валидация start_anon_search
// ═══════════════════════════════════════════════════════════

describe("startAnonSearchSchema", () => {
  it("accepts valid search params", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "female",
      topic: "музыка",
    });
    expect(result.success).toBe(true);
  });

  it("accepts targetGender 'all'", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "all",
      topic: "general",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid targetGender", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "other",
      topic: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty topic", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "male",
      topic: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects topic exceeding max length", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "male",
      topic: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing targetGender", () => {
    const result = startAnonSearchSchema.safeParse({ topic: "test" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  Zod-схемы: валидация leave_anon_chat и typing
// ═══════════════════════════════════════════════════════════

describe("leaveAnonChatSchema", () => {
  it("accepts valid sessionId", () => {
    const result = leaveAnonChatSchema.safeParse({ sessionId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sessionId", () => {
    const result = leaveAnonChatSchema.safeParse({ sessionId: 123 });
    expect(result.success).toBe(false);
  });
});

describe("typingSchema", () => {
  it("accepts valid matchId", () => {
    const result = typingSchema.safeParse({ matchId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid matchId", () => {
    const result = typingSchema.safeParse({ matchId: "" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  SocketRateLimiter
// ═══════════════════════════════════════════════════════════

describe("SocketRateLimiter", () => {
  let limiter: SocketRateLimiter;

  beforeEach(() => {
    limiter = new SocketRateLimiter();
  });

  it("allows requests within limit", () => {
    const config = { windowMs: 60_000, maxEvents: 3 };
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const config = { windowMs: 60_000, maxEvents: 2 };
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(false);
  });

  it("tracks different keys independently", () => {
    const config = { windowMs: 60_000, maxEvents: 1 };
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user2", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(false);
    expect(limiter.check("user2", config)).toBe(false);
  });

  it("resets after window expires", () => {
    const config = { windowMs: 1, maxEvents: 1 };
    expect(limiter.check("user1", config)).toBe(true);
    expect(limiter.check("user1", config)).toBe(false);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(limiter.check("user1", config)).toBe(true);
        resolve();
      }, 10);
    });
  });

  it("cleanup removes expired entries", () => {
    const config = { windowMs: 1, maxEvents: 5 };
    limiter.check("user1", config);
    limiter.check("user2", config);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        limiter.cleanup();
        expect(limiter.check("user1", config)).toBe(true);
        expect(limiter.check("user2", config)).toBe(true);
        resolve();
      }, 10);
    });
  });
});

// ═══════════════════════════════════════════════════════════
//  Интеграционные тесты: Rate limiting + schema edge cases
// ═══════════════════════════════════════════════════════════

describe("Socket handler validation (rate limiter + schema edge cases)", () => {
  it("rate limiter blocks send_message after threshold", () => {
    const limiter = new SocketRateLimiter();
    const config = { windowMs: 60_000, maxEvents: 30 };

    for (let i = 0; i < 30; i++) {
      expect(limiter.check("send_message:user1", config)).toBe(true);
    }
    expect(limiter.check("send_message:user1", config)).toBe(false);
  });

  it("rate limiter blocks start_anon_search after threshold", () => {
    const limiter = new SocketRateLimiter();
    const config = { windowMs: 60_000, maxEvents: 5 };

    for (let i = 0; i < 5; i++) {
      expect(limiter.check("start_anon_search:user1", config)).toBe(true);
    }
    expect(limiter.check("start_anon_search:user1", config)).toBe(false);
  });

  it("rate limiter blocks send_anon_message after threshold", () => {
    const limiter = new SocketRateLimiter();
    const config = { windowMs: 60_000, maxEvents: 30 };

    for (let i = 0; i < 30; i++) {
      expect(limiter.check("send_anon_message:user1", config)).toBe(true);
    }
    expect(limiter.check("send_anon_message:user1", config)).toBe(false);
  });

  it("send_message rejects oversized text payload", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: "A".repeat(10_000),
    });
    expect(result.success).toBe(false);
  });

  it("send_message rejects message with only empty fields", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: undefined,
      attachments: undefined,
      audioUrl: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("send_anon_message rejects oversized attachments array", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
      attachments: Array.from({ length: 100 }, () => "https://ex.com/img.jpg"),
    });
    expect(result.success).toBe(false);
  });

  it("start_anon_search rejects malicious targetGender", () => {
    const result = startAnonSearchSchema.safeParse({
      targetGender: "<script>alert(1)</script>",
      topic: "hacking",
    });
    expect(result.success).toBe(false);
  });

  it("join_chat rejects non-UUID matchId (injection attempt)", () => {
    const result = joinChatSchema.safeParse({
      matchId: "1; DROP TABLE users; --",
    });
    expect(result.success).toBe(false);
  });

  it("typing schema rejects missing matchId", () => {
    const result = typingSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("send_message accepts valid complete payload", () => {
    const result = sendMessageSchema.safeParse({
      matchId: VALID_UUID,
      text: "Привет! Как дела?",
      attachments: ["https://example.com/photo.jpg"],
      audioUrl: "https://example.com/audio.ogg",
      duration: 42,
    });
    expect(result.success).toBe(true);
  });

  it("send_anon_message accepts valid complete payload", () => {
    const result = sendAnonMessageSchema.safeParse({
      sessionId: VALID_UUID,
      text: "Анонимный привет",
    });
    expect(result.success).toBe(true);
  });
});
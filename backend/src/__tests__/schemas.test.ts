import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "../schemas/user.schema.js";
import { likeSchema } from "../schemas/swipe.schema.js";

// ─── updateProfileSchema ────────────────────────────────

describe("updateProfileSchema", () => {
  it("accepts valid full profile data", () => {
    const result = updateProfileSchema.body.safeParse({
      name: "Анна",
      age: 25,
      city: "Москва",
      gender: "female",
      targetGender: "male",
      bio: "Люблю путешествия",
      purpose: "Серьёзные отношения",
      interests: ["музыка", "спорт"],
      hasProfile: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty body (all fields are optional)", () => {
    const result = updateProfileSchema.body.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects age < 18", () => {
    const result = updateProfileSchema.body.safeParse({ age: 15 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("age"));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Минимальный возраст — 18");
    }
  });

  it("rejects age > 99", () => {
    const result = updateProfileSchema.body.safeParse({ age: 150 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("age"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects invalid gender value", () => {
    const result = updateProfileSchema.body.safeParse({ gender: "other" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("gender")
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Пол должен быть male или female");
    }
  });

  it("rejects name exceeding 50 characters", () => {
    const result = updateProfileSchema.body.safeParse({
      name: "А".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects bio exceeding 500 characters", () => {
    const result = updateProfileSchema.body.safeParse({
      bio: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 interests", () => {
    const result = updateProfileSchema.body.safeParse({
      interests: Array.from({ length: 11 }, (_, i) => `interest-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

// ─── likeSchema ─────────────────────────────────────────

describe("likeSchema", () => {
  const validLike = {
    toUserId: "550e8400-e29b-41d4-a716-446655440000",
    type: "LIKE" as const,
  };

  it("accepts valid LIKE data", () => {
    const result = likeSchema.body.safeParse(validLike);
    expect(result.success).toBe(true);
  });

  it("accepts DISLIKE type", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      type: "DISLIKE",
    });
    expect(result.success).toBe(true);
  });

  it("accepts SUPERLIKE type", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      type: "SUPERLIKE",
    });
    expect(result.success).toBe(true);
  });

  it("accepts LIKE with optional message", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      message: "Привет! 👋",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID in toUserId", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      toUserId: "not-a-valid-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("toUserId")
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("toUserId должен быть UUID");
    }
  });

  it("rejects invalid type", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      type: "INVALID_TYPE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("type"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects message exceeding 200 characters", () => {
    const result = likeSchema.body.safeParse({
      ...validLike,
      message: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

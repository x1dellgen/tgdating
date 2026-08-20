import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// ─── Типы ────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  userId?: string;
  telegramId?: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// ─── Конфиг ──────────────────────────────────────────────

const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "super-secret-key";
const JWT_EXPIRES_IN = "30d";

// ─── Валидация Telegram initData (HMAC-SHA256) ───────────

function validateInitData(initData: string): TelegramUser | null {
  if (!BOT_TOKEN) {
    console.error("[auth] BOT_TOKEN не задан");
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  // Удаляем hash из параметров для проверки подписи
  params.delete("hash");

  // Сортируем параметры и формируем data-check-string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Вычисляем HMAC-SHA256 от токена "WebAppData"
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  // Вычисляем HMAC-SHA256 от data-check-string
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    return null;
  }

  // Проверяем, что initData не старше 24 часов
  const authDate = params.get("auth_date");
  if (authDate) {
    const authTimestamp = parseInt(authDate, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - authTimestamp > 86400) {
      return null; // Данные устарели
    }
  }

  // Извлекаем данные пользователя
  const userParam = params.get("user");
  if (!userParam) return null;

  try {
    const user: TelegramUser = JSON.parse(userParam);
    return user;
  } catch {
    return null;
  }
}

// ─── Генерация JWT ────────────────────────────────────────

function generateJwt(userId: string, telegramId: string): string {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// ─── Публичный эндпоинт: авторизация через initData ──────

export async function authFromInitData(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { initData } = req.body as { initData?: string };

    if (!initData) {
      res.status(400).json({ error: "initData обязателен" });
      return;
    }

    const telegramUser = validateInitData(initData);
    if (!telegramUser) {
      res.status(401).json({ error: "Неверная подпись Telegram" });
      return;
    }

    // Upsert пользователя в БД
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      update: {
        name: telegramUser.first_name,
      },
      create: {
        telegramId: BigInt(telegramUser.id),
        name: telegramUser.first_name,
        hasProfile: false,
      },
    });

    const token = generateJwt(user.id, String(telegramUser.id));

    res.json({
      token,
      user: {
        id: user.id,
        telegramId: String(user.telegramId),
        name: user.name,
        hasProfile: user.hasProfile,
      },
    });
  } catch (error) {
    console.error("[auth] Ошибка авторизации:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

// ─── Middleware: проверка JWT ─────────────────────────────

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Токен не предоставлен" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      telegramId: string;
    };

    req.userId = payload.userId;
    req.telegramId = payload.telegramId;
    next();
  } catch {
    res.status(401).json({ error: "Недействительный токен" });
  }
}
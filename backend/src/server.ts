import "./config/env.js"; // Fail-fast: падает при невалидных env
import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { authMiddleware, authFromInitData } from "./middleware/auth.middleware.js";
import usersRouter from "./routes/users.js";
import swipesRouter from "./routes/swipes.js";
import matchesRouter from "./routes/matches.js";
import { initSocket } from "./socket.js";

// ─── Конфиг ──────────────────────────────────────────────

const PORT = env.PORT;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Express приложение ──────────────────────────────────

const app = express();

// ─── Middleware ───────────────────────────────────────────

app.use(
  cors({
    origin: "*", // В проде ограничить доменами
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Раздача статики (загруженные фото и т.д.)
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// ─── Swagger / OpenAPI документация ────────────────────────

/**
 * @openapi
 * /api/docs:
 *   get:
 *     tags:
 *       - Docs
 *     summary: Интерактивная документация API
 *     description: Swagger UI для тестирования всех эндпоинтов.
 *     responses:
 *       200:
 *         description: HTML-страница Swagger UI
 */
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Vibe Dating API — Docs",
}));

// ─── Rate Limiting ────────────────────────────────────────

/** Общий лимит для API: 100 запросов в минуту на IP */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});

/** Строгий лимит для авторизации: 10 запросов в минуту на IP */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток авторизации, попробуйте позже" },
});

/** Лимит для лайков: 60 запросов в минуту на IP */
const swipeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});

// ─── Публичные роуты ─────────────────────────────────────

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Проверка здоровья сервера
 *     description: Возвращает текущий статус сервера, timestamp и uptime.
 *     responses:
 *       200:
 *         description: Сервер работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-15T12:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Время работы в секундах
 *                   example: 3600.5
 */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /api/auth/telegram:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Авторизация через Telegram initData
 *     description: >
 *       Принимает initData из Telegram Mini App, валидирует подпись (HMAC-SHA256),
 *       создаёт или находит пользователя и возвращает JWT-токен.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - initData
 *             properties:
 *               initData:
 *                 type: string
 *                 description: Строка initData из Telegram WebApp
 *                 example: "user=%7B%22id%22%3A123456%2C%22first_name%22%3A%22John%22%7D&auth_date=1700000000&hash=abc123"
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT-токен (срок 30 дней)
 *                   example: "eyJhbGciOiJIUzI1NiIs..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     telegramId:
 *                       type: string
 *                       example: "123456"
 *                     name:
 *                       type: string
 *                       example: "John"
 *                     hasProfile:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: initData не передан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Невалидная подпись Telegram
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post("/api/auth/telegram", authLimiter, authFromInitData);

// ─── Защищённые роуты ─────────────────────────────────────

app.use("/api/users", apiLimiter, authMiddleware, usersRouter);
app.use("/api/swipes", swipeLimiter, authMiddleware, swipesRouter);
app.use("/api/matches", apiLimiter, authMiddleware, matchesRouter);

// ─── 404 handler ─────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// ─── Global error handler ────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[server] Необработанная ошибка:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
);

// ─── HTTP + WebSocket сервер ─────────────────────────────

const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket (Socket.io) активен`);
});

export default app;

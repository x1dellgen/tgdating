import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authMiddleware, authFromInitData } from "./middleware/auth.middleware.js";
import usersRouter from "./routes/users.js";
import swipesRouter from "./routes/swipes.js";
import matchesRouter from "./routes/matches.js";
import { initSocket } from "./socket.js";

// ─── Конфиг ──────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "5000", 10);
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

app.use(express.json());

// Раздача статики (загруженные фото и т.д.)
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// ─── Публичные роуты ─────────────────────────────────────

// Проверка здоровья сервера
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Авторизация через Telegram initData
app.post("/api/auth/telegram", authFromInitData);

// ─── Защищённые роуты ─────────────────────────────────────

app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/swipes", authMiddleware, swipesRouter);
app.use("/api/matches", authMiddleware, matchesRouter);

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

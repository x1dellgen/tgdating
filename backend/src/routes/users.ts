import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../lib/prisma.js";
import upload from "../lib/upload.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "..", "..", "uploads");

const router = Router();

// ─── GET /api/users/me — текущий профиль ──────────────────

router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json({
      id: user.id,
      telegramId: String(user.telegramId),
      name: user.name,
      age: user.age,
      city: user.city,
      gender: user.gender,
      targetGender: user.targetGender,
      bio: user.bio,
      photos: user.photos,
      purpose: user.purpose,
      interests: user.interests,
      hasProfile: user.hasProfile,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[users] GET /me error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── PUT /api/users/me — создать / обновить профиль ───────

router.put("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      age,
      city,
      gender,
      targetGender,
      bio,
      purpose,
      interests,
      hasProfile,
    } = req.body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name;
    if (age !== undefined) data.age = age !== null ? Number(age) : null;
    if (city !== undefined) data.city = city;
    if (gender !== undefined) data.gender = gender;
    if (targetGender !== undefined) data.targetGender = targetGender;
    if (bio !== undefined) data.bio = bio;
    if (purpose !== undefined) data.purpose = purpose;
    if (interests !== undefined) data.interests = interests;
    if (hasProfile !== undefined) data.hasProfile = hasProfile;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json({
      id: user.id,
      telegramId: String(user.telegramId),
      name: user.name,
      age: user.age,
      city: user.city,
      gender: user.gender,
      targetGender: user.targetGender,
      bio: user.bio,
      photos: user.photos,
      purpose: user.purpose,
      interests: user.interests,
      hasProfile: user.hasProfile,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[users] PUT /me error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── POST /api/users/me/photos — загрузить фотографии ─────

router.post(
  "/me/photos",
  upload.array("photos", 10),
  async (req: AuthenticatedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        res.status(400).json({ error: "Файлы не загружены" });
        return;
      }

      const newPaths = files.map((f) => `/uploads/${f.filename}`);

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { photos: true },
      });

      if (!user) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }

      const updatedPhotos = [...user.photos, ...newPaths];

      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: { photos: updatedPhotos },
      });

      res.json({ photos: updated.photos });
    } catch (error) {
      console.error("[users] POST /me/photos error:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
);

// ─── DELETE /api/users/me/photos — удалить фотографию ─────

router.delete("/me/photos", async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url) {
      res.status(400).json({ error: "url фотографии обязателен" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { photos: true },
    });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    if (!user.photos.includes(url)) {
      res.status(404).json({ error: "Фотография не найдена у пользователя" });
      return;
    }

    // Удаляем файл с диска
    const filename = path.basename(url);
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // Файл мог быть уже удалён — не критично
      console.warn("[users] Не удалось удалить файл:", filePath);
    }

    // Обновляем массив в БД
    const updatedPhotos = user.photos.filter((p: string) => p !== url);

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { photos: updatedPhotos },
    });

    res.json({ photos: updated.photos });
  } catch (error) {
    console.error("[users] DELETE /me/photos error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── DELETE /api/users/me — сбросить профиль ──────────────

router.delete("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { hasProfile: false },
    });

    res.json({
      id: user.id,
      hasProfile: user.hasProfile,
    });
  } catch (error) {
    console.error("[users] DELETE /me error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

export default router;
import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../lib/prisma.js";
import upload, { validateUploadedFiles } from "../lib/upload.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema, deletePhotoSchema } from "../schemas/user.schema.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "..", "..", "uploads");

const router = Router();

// ─── GET /api/users/me — текущий профиль ──────────────────

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получить текущий профиль
 *     description: Возвращает профиль авторизованного пользователя.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 telegramId:
 *                   type: string
 *                   example: "123456"
 *                 name:
 *                   type: string
 *                   example: "Анна"
 *                 age:
 *                   type: integer
 *                   example: 25
 *                 city:
 *                   type: string
 *                   example: "Москва"
 *                 gender:
 *                   type: string
 *                   enum: [male, female]
 *                 targetGender:
 *                   type: string
 *                   enum: [male, female, all]
 *                 bio:
 *                   type: string
 *                   example: "Люблю путешествия"
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 purpose:
 *                   type: string
 *                   example: "Отношения"
 *                 interests:
 *                   type: array
 *                   items:
 *                     type: string
 *                 hasProfile:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags:
 *       - Users
 *     summary: Создать или обновить профиль
 *     description: >
 *       Обновляет поля профиля авторизованного пользователя.
 *       Все поля опциональны — передаётся только то, что нужно изменить.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "Анна"
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 99
 *                 example: 25
 *               city:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Москва"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               targetGender:
 *                 type: string
 *                 enum: [male, female, all]
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Люблю путешествия и котов"
 *               purpose:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Отношения"
 *               interests:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                 example: ["музыка", "спорт"]
 *               hasProfile:
 *                 type: boolean
 *                 description: Установить true после заполнения профиля
 *     responses:
 *       200:
 *         description: Обновлённый профиль
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 telegramId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 age:
 *                   type: integer
 *                 city:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 targetGender:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 purpose:
 *                   type: string
 *                 interests:
 *                   type: array
 *                   items:
 *                     type: string
 *                 hasProfile:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Ошибка валидации (Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/me",
  validate(updateProfileSchema),
  async (req: AuthenticatedRequest, res) => {
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
      if (age !== undefined) data.age = age;
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
  }
);

// ─── POST /api/users/me/photos — загрузить фотографии ─────

router.post(
  "/me/photos",
  upload.array("photos", 10),
  validateUploadedFiles,
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

      // Проверяем лимит: не более 10 фото суммарно
      if (user.photos.length + newPaths.length > 10) {
        // Удаляем только что загруженные файлы
        for (const p of newPaths) {
          const filePath = path.join(UPLOADS_DIR, path.basename(p));
          await fs.unlink(filePath).catch(() => {});
        }
        res.status(400).json({ error: "Максимум 10 фотографий" });
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

/**
 * @openapi
 * /api/users/me/photos:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Удалить фотографию
 *     description: Удаляет фотографию из профиля пользователя и с диска.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL фотографии (начинается с /uploads/ или полный URL)
 *                 example: "/uploads/abc123.jpg"
 *     responses:
 *       200:
 *         description: Обновлённый список фотографий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Фотография не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/me/photos",
  validate(deletePhotoSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { url } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { photos: true },
      });

      if (!user) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }

      // Проверяем, что фото принадлежит пользователю
      if (!user.photos.includes(url)) {
        res.status(404).json({ error: "Фотография не найдена у пользователя" });
        return;
      }

      // Удаляем файл с диска (только если url начинается с /uploads/)
      if (url.startsWith("/uploads/")) {
        const filename = path.basename(url);
        const filePath = path.join(UPLOADS_DIR, filename);
        try {
          await fs.unlink(filePath);
        } catch {
          // Файл мог быть уже удалён — не критично
          console.warn("[users] Не удалось удалить файл:", filePath);
        }
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
  }
);

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
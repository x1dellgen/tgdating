import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Request, Response, NextFunction } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "..", "..", "uploads");

// ─── Разрешённые MIME-типы ────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/webm",
  "audio/mp3",
  "audio/ogg",
];

// ─── Хранилище на диске ───────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const name = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

// ─── Фильтр файлов ────────────────────────────────────────

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}`));
  }
}

// ─── Экспорт upload-инстанса ──────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 МБ
  },
});

export default upload;

// ─── Magic Bytes валидация ──────────────────────────────────

/**
 * Минимальные сигнатуры (magic bytes) для разрешённых MIME-типов.
 * Каждый тип может иметь несколько допустимых сигнатур.
 */
const MAGIC_SIGNATURES: Record<string, Array<{ offset: number; bytes: number[] }>> = {
  "image/jpeg":   [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png":    [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],       // ‰PNG
  "image/webp":   [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },        // RIFF
                   { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],        // WEBP
  "audio/webm":   [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }],       // EBML
  "audio/ogg":    [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }],       // OggS
  "audio/mp3":    [{ offset: 0, bytes: [0x49, 0x44, 0x33] },              // ID3
                   { offset: 0, bytes: [0xff, 0xfb] },                      // MPEG sync
                   { offset: 0, bytes: [0xff, 0xf3] },
                   { offset: 0, bytes: [0xff, 0xf2] }],
};

/**
 * Проверяет magic bytes файла на диске против ожидаемого MIME-типа.
 * Читает первые 12 байт файла (максимальный offset + длина сигнатуры).
 */
async function validateFileMagicBytes(
  filePath: string,
  expectedMime: string
): Promise<boolean> {
  const signatures = MAGIC_SIGNATURES[expectedMime];
  if (!signatures) return false;

  const maxOffset = Math.max(...signatures.map((s) => s.offset + s.bytes.length));
  const buf = Buffer.alloc(maxOffset);

  const fh = await fs.open(filePath, "r");
  try {
    const { bytesRead } = await fh.read(buf, 0, maxOffset, 0);
    if (bytesRead < maxOffset) return false;

    // Проверяем: КАЖДАЯ сигнатура MIME-типа должна совпасть
    // (для WebP нужны и RIFF, и WEBP; для mp3 достаточно одной из альтернатив)
    const grouped = new Map<string, typeof signatures>();
    for (const sig of signatures) {
      const key = `${sig.offset}:${sig.bytes.length}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(sig);
    }

    // Для каждого offset/length — достаточно одного совпадения (OR)
    // Между разными offset/length — все должны совпасть (AND)
    for (const group of grouped.values()) {
      const anyMatch = group.some((sig) =>
        sig.bytes.every((byte, i) => buf[sig.offset + i] === byte)
      );
      if (!anyMatch) return false;
    }

    return true;
  } finally {
    await fh.close();
  }
}

/**
 * Express-middleware: проверяет magic bytes загруженных файлов.
 * Работает с upload.single() (req.file) и upload.array() (req.files).
 * Удаляет невалидные файлы с диска и возвращает 400.
 */
export function validateUploadedFiles(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const files: Express.Multer.File[] = [];

  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...(req.files as Express.Multer.File[]));

  if (files.length === 0) {
    next();
    return;
  }

  Promise.all(
    files.map(async (file) => {
      const valid = await validateFileMagicBytes(file.path, file.mimetype);
      return { file, valid };
    })
  )
    .then((results) => {
      const invalid = results.filter((r) => !r.valid);

      if (invalid.length > 0) {
        // Удаляем все загруженные файлы (и валидные тоже — частичная загрузка бессмыслена)
        Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));

        res.status(400).json({
          error: `Содержимое ${invalid.length} файла(ов) не соответствует заявленному типу`,
        });
        return;
      }

      next();
    })
    .catch((err) => {
      console.error("[upload] Ошибка валидации файлов:", err);
      Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
      res.status(500).json({ error: "Ошибка валидации файлов" });
    });
}
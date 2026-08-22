import { z } from "zod";

/**
 * Zod-схемы валидации для Socket.io событий.
 * Ограничения синхронизированы с REST-схемами проекта.
 */

// ─── Общие примитивы ──────────────────────────────────────

/** UUID (совпадает с Prisma @id @default(uuid())) */
const uuid = z.string().uuid("Идентификатор должен быть UUID");

/** Максимальная длина текстового сообщения (совпадает с bio: 500) */
const TEXT_MAX = 1000;

/** Максимум вложений в одном сообщении */
const ATTACHMENTS_MAX = 10;

/** Максимальный размер одного URL вложения (base64 ~20MB → строка ~28MB, но разумный лимит) */
const ATTACHMENT_URL_MAX = 100_000;

/** Максимальная длительность аудио (секунды) */
const DURATION_MAX = 600; // 10 минут

/** Максимальная длина topic для анонимного поиска */
const TOPIC_MAX = 100;

// ─── send_message ─────────────────────────────────────────

export const sendMessageSchema = z
  .object({
    matchId: uuid,
    text: z
      .string()
      .max(TEXT_MAX, `Текст не может превышать ${TEXT_MAX} символов`)
      .optional(),
    attachments: z
      .array(
        z
          .string()
          .max(
            ATTACHMENT_URL_MAX,
            `URL вложения слишком длинный (${ATTACHMENT_URL_MAX} символов)`
          )
      )
      .max(ATTACHMENTS_MAX, `Максимум ${ATTACHMENTS_MAX} вложений`)
      .optional(),
    audioUrl: z
      .string()
      .max(ATTACHMENT_URL_MAX, "URL аудио слишком длинный")
      .optional(),
    duration: z
      .number()
      .int("Длительность должна быть целым числом")
      .min(0, "Длительность не может быть отрицательной")
      .max(DURATION_MAX, `Длительность не может превышать ${DURATION_MAX} секунд`)
      .optional(),
  })
  .refine(
    (data) => data.text || data.attachments?.length || data.audioUrl,
    { message: "Сообщение должно содержать текст, вложение или аудио" }
  );

// ─── send_anon_message ────────────────────────────────────

export const sendAnonMessageSchema = z
  .object({
    sessionId: uuid,
    text: z
      .string()
      .max(TEXT_MAX, `Текст не может превышать ${TEXT_MAX} символов`)
      .optional(),
    attachments: z
      .array(
        z
          .string()
          .max(
            ATTACHMENT_URL_MAX,
            `URL вложения слишком длинный (${ATTACHMENT_URL_MAX} символов)`
          )
      )
      .max(ATTACHMENTS_MAX, `Максимум ${ATTACHMENTS_MAX} вложений`)
      .optional(),
    audioUrl: z
      .string()
      .max(ATTACHMENT_URL_MAX, "URL аудио слишком длинный")
      .optional(),
    duration: z
      .number()
      .int("Длительность должна быть целым числом")
      .min(0, "Длительность не может быть отрицательной")
      .max(DURATION_MAX, `Длительность не может превышать ${DURATION_MAX} секунд`)
      .optional(),
  })
  .refine(
    (data) => data.text || data.attachments?.length || data.audioUrl,
    { message: "Сообщение должно содержать текст, вложение или аудио" }
  );

// ─── join_chat ─────────────────────────────────────────────

export const joinChatSchema = z.object({
  matchId: uuid,
});

// ─── start_anon_search ────────────────────────────────────

export const startAnonSearchSchema = z.object({
  targetGender: z.enum(["male", "female", "all"], {
    message: "targetGender должен быть male, female или all",
  }),
  topic: z
    .string()
    .min(1, "Тема обязательна")
    .max(TOPIC_MAX, `Тема не может превышать ${TOPIC_MAX} символов`)
    .trim(),
});

// ─── leave_anon_chat ──────────────────────────────────────

export const leaveAnonChatSchema = z.object({
  sessionId: uuid,
});

// ─── typing_start / typing_stop ───────────────────────────

export const typingSchema = z.object({
  matchId: uuid,
});

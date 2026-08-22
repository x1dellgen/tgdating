/**
 * Простой in-memory rate limiter для Socket.io событий.
 *
 * Подходит для однопроцессного deployment.
 * Для multi-process нужно заменить на Redis-based реализацию.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  /** Окно в миллисекундах */
  windowMs: number;
  /** Максимум событий за окно */
  maxEvents: number;
}

// ─── Константы (вынесены для удобства изменения) ──────────

/** send_message: 30 сообщений в минуту */
export const SEND_MESSAGE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxEvents: 30,
};

/** send_anon_message: 30 сообщений в минуту */
export const SEND_ANON_MESSAGE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxEvents: 30,
};

/** start_anon_search: 5 поисков в минуту */
export const START_ANON_SEARCH_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxEvents: 5,
};

// ─── Реализация ───────────────────────────────────────────

export class SocketRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  /**
   * Проверить, не превышен ли лимит.
   * Возвращает true если запрос разрешён, false если превышен.
   */
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // Новое окно
      this.store.set(key, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    if (entry.count >= config.maxEvents) {
      return false;
    }

    entry.count++;
    return true;
  }

  /** Очистить устаревшие записи (вызывать периодически) */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

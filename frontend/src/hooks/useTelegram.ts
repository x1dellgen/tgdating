import { useState } from 'react';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
}

/**
 * Хук для инициализации и доступа к Telegram Web App SDK.
 * Безопасно работает вне Telegram (возвращает заглушку).
 */
export function useTelegram() {
  const [webApp] = useState<TelegramWebApp | null>(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
      .Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
    }
    return tg ?? null;
  });

  return { webApp };
}
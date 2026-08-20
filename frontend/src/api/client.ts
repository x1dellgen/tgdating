/**
 * API-клиент для связи фронтенда с бэкендом.
 *
 * 1. HTTP-запросы через Axios с автоматическим JWT-токеном.
 * 2. Авторизация через Telegram WebApp initData.
 * 3. Менеджер Socket.io-подключения с JWT-авторизацией.
 */
import axios, { type AxiosInstance } from 'axios';
import { io, type Socket } from 'socket.io-client';

/* ─── Конфигурация ─────────────────────────────────────── */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'datesphere_jwt_token';

/* ─── HTTP-клиент (Axios) ──────────────────────────────── */

export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Автоматическая подстановка JWT-токена в каждый запрос
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка 401 — очищаем токен (в будущем можно добавить refresh)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      // Можно добавить редирект на экран авторизации
    }
    return Promise.reject(error);
  },
);

/* ─── Управление токеном ───────────────────────────────── */

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/* ─── Авторизация через Telegram ───────────────────────── */

interface AuthResponse {
  token: string;
  user: {
    id: string;
    telegramId: string;
    name: string;
    hasProfile: boolean;
  };
}

/**
 * Авторизует пользователя через Telegram WebApp initData.
 * Если initData недоступен (дев-режим), пробует dev-режим.
 * Возвращает JWT-токен и данные пользователя.
 */
export async function authenticateWithTelegram(): Promise<AuthResponse | null> {
  // Уже авторизованы — не повторяем запрос
  const existingToken = getToken();
  if (existingToken) {
    return null; // токен уже есть, запрос не нужен
  }

  // Получаем initData из Telegram WebApp SDK
  const initData = getTelegramInitData();

  if (initData) {
    try {
      const { data } = await http.post<AuthResponse>('/api/auth/telegram', { initData });
      setToken(data.token);
      return data;
    } catch (err) {
      console.error('[api] Ошибка авторизации через Telegram:', err);
      return null;
    }
  }

  // Fallback для дев-режима: генерируем тестовый initData
  if (import.meta.env.DEV) {
    console.warn('[api] Telegram initData недоступен. DEV-режим: авторизация пропущена.');
    // В dev-режиме можно попробовать авторизоваться с тестовым initData
    // или вернуть null и позволить приложению работать без авторизации
    return null;
  }

  return null;
}

/** Безопасно извлекает initData из Telegram WebApp SDK */
function getTelegramInitData(): string | null {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } })
      .Telegram?.WebApp;
    return tg?.initData || null;
  } catch {
    return null;
  }
}

/* ─── Socket.io менеджер ───────────────────────────────── */

let socket: Socket | null = null;

/**
 * Возвращает синглтон Socket.io-подключения.
 * Подключение создаётся при первом вызове и переиспользуется.
 * JWT-токен передаётся через auth.token.
 */
export function getSocket(): Socket | null {
  const token = getToken();
  if (!token) {
    console.warn('[socket] Нет JWT-токена — Socket.io не подключается');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[socket] Подключён:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] Отключён:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] Ошибка подключения:', err.message);
  });

  return socket;
}

/**
 * Отключает Socket.io и обнуляет ссылку.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Базовый URL для загрузок (фото и т.д.) */
export const UPLOADS_BASE_URL = API_URL;
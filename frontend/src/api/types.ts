/**
 * Типы ответов бэкенда и мапперы для преобразования в формат фронтенда.
 */
import type { MockProfile } from '../features/swipes/mockProfiles';

/* ─── Типы ответов API ─────────────────────────────────── */

/** Профиль пользователя из API */
export interface ApiUser {
  id: string;
  telegramId?: string;
  name: string;
  age: number | null;
  city: string | null;
  gender?: string | null;
  targetGender?: string | null;
  bio: string | null;
  photos: string[];
  purpose: string | null;
  interests: string[];
  hasProfile?: boolean;
  createdAt?: string;
}

/** Профиль из ленты свайпов */
export interface ApiFeedProfile {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  gender?: string | null;
  bio: string | null;
  photos: string[];
  purpose: string | null;
  interests: string[];
}

/** Входящий лайк */
export interface ApiLike {
  id: string;
  type: 'LIKE' | 'SUPERLIKE' | 'DISLIKE';
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    age: number | null;
    city: string | null;
    photos: string[];
    bio: string | null;
  };
}

/** Мэтч */
export interface ApiMatch {
  id: string;
  createdAt: string;
  partner: {
    id: string;
    name: string;
    age: number | null;
    city: string | null;
    photos: string[];
    bio: string | null;
  };
  lastMessage: {
    id: string;
    text: string | null;
    senderId: string;
    audioUrl: string | null;
    attachments: string[];
    createdAt: string;
  } | null;
}

/** Сообщение из истории */
export interface ApiMessage {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  text: string | null;
  attachments: string[];
  audioUrl: string | null;
  duration: number | null;
  createdAt: string;
}

/* ─── Мапперы ──────────────────────────────────────────── */

/**
 * Преобразует API-профиль в формат MockProfile, используемый на фронтенде.
 * Совместимость с существующим UI.
 */
export function mapApiProfileToMock(profile: ApiFeedProfile | ApiUser): MockProfile {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age ?? 0,
    city: profile.city ?? '',
    bio: profile.bio ?? '',
    photos: profile.photos,
    interests: profile.interests,
    goal: profile.purpose ?? 'Не указано',
    isAdult: (profile.age ?? 0) >= 18,
  };
}

/** Результат отправки лайка */
export interface ApiLikeResponse {
  like: {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: string;
    message: string | null;
    createdAt: string;
  };
  isMatch: boolean;
  matchData: unknown | null;
}
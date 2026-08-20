import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { MockProfile } from '../features/swipes/mockProfiles';
import { http, UPLOADS_BASE_URL } from '../api/client';
import type {
  ApiFeedProfile,
  ApiLike,
  ApiMatch,
  ApiLikeResponse,
} from '../api/types';
import { mapApiProfileToMock } from '../api/types';

/** Ключи для localStorage */
const LS_BLOCKED_KEY = 'datesphere_blockedUserIds';

/** Загружаем список заблокированных из localStorage */
function loadBlockedIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_BLOCKED_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

/** Сохраняем список заблокированных в localStorage */
function saveBlockedIds(ids: string[]) {
  try {
    localStorage.setItem(LS_BLOCKED_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

/** Преобразует URL фото: если это относительный путь бэкенда, добавляет базовый URL */
function resolvePhotoUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${url}`;
  }
  return url;
}

/** Нормализует фото профиля */
function normalizePhotos(photos: string[]): string[] {
  return photos.map(resolvePhotoUrl);
}

interface MatchContextValue {
  activeMatchProfile: MockProfile | null;
  triggerMatch: (profile: MockProfile) => void;
  dismissMatch: () => void;
  /** Колбэк, который вызовется при нажатии «Написать сообщение» */
  onNavigateToChats: (() => void) | null;
  setOnNavigateToChats: (cb: (() => void) | null) => void;
  /** Регистрирует колбэк, который вызывается немедленно при triggerMatch (для создания чата) */
  setOnMatchCallback: (cb: ((profile: MockProfile) => void) | null) => void;
  /** ID профилей, которые пользователь лайкнул (включая авто-лайки из анонимного чата) */
  likedByMe: Set<string>;
  /** Добавляет профиль в лайкнутые (авто-лайк из анонимного чата) */
  addLike: (profileId: string) => void;
  /** Проверяет, лайкнул ли пользователь этот профиль */
  hasLiked: (profileId: string) => boolean;
  /** ID профилей, с которыми сформирован взаимный мэтч */
  matchedProfileIds: Set<string>;
  /** Удаляет мэтч и стирает переписку с указанным профилем */
  unmatchProfile: (profileId: string) => void;
  /** ID заблокированных пользователей */
  blockedUserIds: Set<string>;
  /** Заблокировать + пожаловаться */
  blockAndReportUser: (profileId: string, reason: string) => void;

  /* ─── Новые поля для API-интеграции ─── */

  /** Лента профилей из API */
  feedProfiles: MockProfile[];
  /** Загрузка ленты в процессе */
  feedLoading: boolean;
  /** Загрузить / обновить ленту свайпов */
  loadFeed: () => Promise<void>;
  /**
   * Отправить реакцию (лайк / дизлайк / суперлайк) на профиль.
   * Возвращает true, если произошёл мэтч.
   */
  sendReaction: (toUserId: string, type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE', message?: string) => Promise<boolean>;
  /** Входящие лайки */
  incomingLikes: ApiLike[];
  /** Загрузить входящие лайки */
  loadIncomingLikes: () => Promise<void>;
  /** Список мэтчей из API */
  matchesList: ApiMatch[];
  /** Загрузить мэтчи */
  loadMatches: () => Promise<void>;
  /** Текущий userId (определяется после авторизации) */
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [activeMatchProfile, setActiveMatchProfile] = useState<MockProfile | null>(null);
  const [onNavigateToChats, setOnNavigateToChats] = useState<(() => void) | null>(null);
  const onMatchCallbackRef = useRef<((profile: MockProfile) => void) | null>(null);
  const [likedByMe, setLikedByMe] = useState<Set<string>>(new Set());
  const [matchedProfileIds, setMatchedProfileIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(() => new Set(loadBlockedIds()));

  /* ─── Новые стейты ─── */
  const [feedProfiles, setFeedProfiles] = useState<MockProfile[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [incomingLikes, setIncomingLikes] = useState<ApiLike[]>([]);
  const [matchesList, setMatchesList] = useState<ApiMatch[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Синхронизация blockedUserIds → localStorage
  useEffect(() => {
    saveBlockedIds([...blockedUserIds]);
  }, [blockedUserIds]);

  const setOnMatchCallback = useCallback((cb: ((profile: MockProfile) => void) | null) => {
    onMatchCallbackRef.current = cb;
  }, []);

  const triggerMatch = useCallback((profile: MockProfile) => {
    // Немедленно создаём чат, независимо от действий пользователя в оверлее
    onMatchCallbackRef.current?.(profile);
    setActiveMatchProfile(profile);
    // Регистрируем мэтч
    setMatchedProfileIds((prev) => {
      const next = new Set(prev);
      next.add(profile.id);
      return next;
    });
  }, []);

  const dismissMatch = useCallback(() => {
    setActiveMatchProfile(null);
  }, []);

  const addLike = useCallback((profileId: string) => {
    setLikedByMe((prev) => {
      const next = new Set(prev);
      next.add(profileId);
      return next;
    });
  }, []);

  const hasLiked = useCallback(
    (profileId: string) => likedByMe.has(profileId),
    [likedByMe],
  );

  /* ─── Загрузка ленты ─── */

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const { data } = await http.get<{ profiles: ApiFeedProfile[] }>('/api/swipes/feed', {
        params: { limit: 50 },
      });
      const profiles = data.profiles.map((p) => ({
        ...mapApiProfileToMock(p),
        photos: normalizePhotos(p.photos),
      }));
      setFeedProfiles(profiles);
    } catch (err) {
      console.error('[MatchContext] Ошибка загрузки ленты:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  /* ─── Отправка реакции ─── */

  const sendReaction = useCallback(
    async (toUserId: string, type: 'LIKE' | 'DISLIKE' | 'SUPERLIKE', message?: string): Promise<boolean> => {
      try {
        // Отмечаем лайк локально
        if (type === 'LIKE' || type === 'SUPERLIKE') {
          addLike(toUserId);
        }

        const { data } = await http.post<ApiLikeResponse>('/api/swipes/like', {
          toUserId,
          type,
          message: message ?? null,
        });

        if (data.isMatch) {
          // Мэтч произошёл — обновляем список мэтч-айди
          setMatchedProfileIds((prev) => {
            const next = new Set(prev);
            next.add(toUserId);
            return next;
          });
          return true;
        }
        return false;
      } catch (err) {
        console.error('[MatchContext] Ошибка отправки реакции:', err);
        return false;
      }
    },
    [addLike],
  );

  /* ─── Загрузка входящих лайков ─── */

  const loadIncomingLikes = useCallback(async () => {
    try {
      const { data } = await http.get<{ likes: ApiLike[] }>('/api/matches/likes');
      // Нормализуем фото
      const likes = data.likes.map((like) => ({
        ...like,
        user: {
          ...like.user,
          photos: normalizePhotos(like.user.photos),
        },
      }));
      setIncomingLikes(likes);
    } catch (err) {
      console.error('[MatchContext] Ошибка загрузки входящих лайков:', err);
    }
  }, []);

  /* ─── Загрузка мэтчей ─── */

  const loadMatches = useCallback(async () => {
    try {
      const { data } = await http.get<{ matches: ApiMatch[] }>('/api/matches');
      // Нормализуем фото
      const matches = data.matches.map((m) => ({
        ...m,
        partner: {
          ...m.partner,
          photos: normalizePhotos(m.partner.photos),
        },
      }));
      setMatchesList(matches);

      // Синхронизируем matchedProfileIds
      const ids = new Set(matches.map((m) => m.partner.id));
      setMatchedProfileIds(ids);
    } catch (err) {
      console.error('[MatchContext] Ошибка загрузки мэтчей:', err);
    }
  }, []);

  /** Удаляет мэтч и стирает переписку */
  const unmatchProfile = useCallback((profileId: string) => {
    // Убираем из мэтчей
    setMatchedProfileIds((prev) => {
      const next = new Set(prev);
      next.delete(profileId);
      return next;
    });
    // Убираем из списка мэтчей
    setMatchesList((prev) => prev.filter((m) => m.partner.id !== profileId));
    // Если открыт чат с этим пользователем — закрываем
    window.dispatchEvent(
      new CustomEvent('datesphere:removeThread', { detail: { profileId } }),
    );
  }, []);

  /** Заблокировать и пожаловаться */
  const blockAndReportUser = useCallback((profileId: string, _reason: string) => {
    // Добавляем в заблокированные
    setBlockedUserIds((prev) => {
      const next = new Set(prev);
      next.add(profileId);
      return next;
    });
    // Автоматически снимаем мэтч
    unmatchProfile(profileId);
  }, [unmatchProfile]);

  return (
    <MatchContext.Provider
      value={{
        activeMatchProfile,
        triggerMatch,
        dismissMatch,
        onNavigateToChats,
        setOnNavigateToChats,
        setOnMatchCallback,
        likedByMe,
        addLike,
        hasLiked,
        matchedProfileIds,
        unmatchProfile,
        blockedUserIds,
        blockAndReportUser,
        feedProfiles,
        feedLoading,
        loadFeed,
        sendReaction,
        incomingLikes,
        loadIncomingLikes,
        matchesList,
        loadMatches,
        currentUserId,
        setCurrentUserId,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) {
    throw new Error('useMatch must be used within <MatchProvider>');
  }
  return ctx;
}
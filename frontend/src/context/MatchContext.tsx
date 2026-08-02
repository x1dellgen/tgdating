import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { MockProfile } from '../features/swipes/mockProfiles';

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
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [activeMatchProfile, setActiveMatchProfile] = useState<MockProfile | null>(null);
  const [onNavigateToChats, setOnNavigateToChats] = useState<(() => void) | null>(null);
  const onMatchCallbackRef = useRef<((profile: MockProfile) => void) | null>(null);
  const [likedByMe, setLikedByMe] = useState<Set<string>>(new Set());
  const [matchedProfileIds, setMatchedProfileIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(() => new Set(loadBlockedIds()));

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

  /** Удаляет мэтч и стирает переписку */
  const unmatchProfile = useCallback((profileId: string) => {
    // Убираем из мэтчей
    setMatchedProfileIds((prev) => {
      const next = new Set(prev);
      next.delete(profileId);
      return next;
    });
    // Если открыт чат с этим пользователем — закрываем
    // (ChatContext потребует удаления треда — вызываем через кастомный эвент)
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

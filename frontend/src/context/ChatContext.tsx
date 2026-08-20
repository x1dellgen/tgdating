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
import { useRegistration } from './RegistrationContext';
import { useMatch } from './MatchContext';
import { http, getSocket, UPLOADS_BASE_URL } from '../api/client';
import type { ApiMessage } from '../api/types';
import type { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'self' | 'other';
  type: 'text' | 'system' | 'photo' | 'voice';
  timestamp: number;
  photoUrl?: string;
  photoUrls?: string[];
  voiceDuration?: number;
  audioUrl?: string;
}

export interface ChatThread {
  profile: MockProfile;
  messages: ChatMessage[];
  lastMessage: string;
  /** ID мэтча на бэкенде (для API-запросов и Socket.io) */
  matchId?: string;
}

interface ChatContextValue {
  threads: ChatThread[];
  activeThreadId: string | null;
  openChat: (profile: MockProfile, matchId?: string) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  sendPhoto: (url: string) => void;
  sendPhotos: (urls: string[]) => void;
  sendVoice: (duration: number, audioUrl: string) => void;
  shareTelegram: () => void;
  getActiveThread: () => ChatThread | null;
  /** Загрузить историю сообщений из API */
  loadMessages: (matchId: string) => Promise<void>;
  /** Индикатор набора текста собеседником */
  typingUsers: Record<string, boolean>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/** Преобразует URL фото: если это относительный путь бэкенда, добавляет базовый URL */
function resolvePhotoUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${url}`;
  }
  return url;
}

/** Преобразует API-сообщение в формат фронтенда */
function mapApiMessage(msg: ApiMessage, currentUserId: string): ChatMessage {
  const isSelf = msg.senderId === currentUserId;

  // Определяем тип сообщения
  let type: ChatMessage['type'] = 'text';
  if (msg.attachments && msg.attachments.length > 0) {
    type = 'photo';
  } else if (msg.audioUrl) {
    type = 'voice';
  }

  return {
    id: msg.id,
    text: msg.text || '',
    sender: isSelf ? 'self' : 'other',
    type,
    timestamp: new Date(msg.createdAt).getTime(),
    photoUrl: msg.attachments?.length === 1 ? resolvePhotoUrl(msg.attachments[0]) : undefined,
    photoUrls: msg.attachments?.length > 1 ? msg.attachments.map(resolvePhotoUrl) : undefined,
    audioUrl: msg.audioUrl ? resolvePhotoUrl(msg.audioUrl) : undefined,
    voiceDuration: msg.duration ?? undefined,
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const registration = useRegistration();
  const { currentUserId, matchesList } = useMatch();
  const userName = registration.form.name || 'Ты';

  // Ref для хранения сокета
  const socketRef = useRef<Socket | null>(null);

  /* ─── Подключение к Socket.io ─── */

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    // Слушаем новые сообщения
    const onNewMessage = (msg: ApiMessage) => {
      const mapped = mapApiMessage(msg, currentUserId);
      const matchId = msg.matchId;

      setThreads((prev) =>
        prev.map((t) => {
          if (t.matchId !== matchId) return t;
          // Избегаем дубликатов
          if (t.messages.some((m) => m.id === mapped.id)) return t;
          const newMessages = [...t.messages, mapped];
          return {
            ...t,
            messages: newMessages,
            lastMessage: mapped.type === 'photo' ? '📷 Фото' :
              mapped.type === 'voice' ? '🎙️ Голосовое' :
              mapped.text || 'Сообщение',
          };
        }),
      );
    };

    // Слушаем typing
    const onTypingStart = ({ matchId, userId }: { matchId: string; userId: string }) => {
      if (userId === currentUserId) return;
      setTypingUsers((prev) => ({ ...prev, [matchId]: true }));
    };

    const onTypingStop = ({ matchId, userId }: { matchId: string; userId: string }) => {
      if (userId === currentUserId) return;
      setTypingUsers((prev) => ({ ...prev, [matchId]: false }));
    };

    socket.on('new_message', onNewMessage);
    socket.on('typing_start', onTypingStart);
    socket.on('typing_stop', onTypingStop);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('typing_start', onTypingStart);
      socket.off('typing_stop', onTypingStop);
    };
  }, [currentUserId]);

  /* ─── Синхронизация тредов с мэтчами ─── */

  useEffect(() => {
    if (!currentUserId || matchesList.length === 0) return;

    // Создаём / обновляем треды на основе matchesList
    setThreads((prev) => {
      const existingIds = new Set(prev.map((t) => t.profile.id));
      const newThreads: ChatThread[] = [];

      for (const match of matchesList) {
        const partner = match.partner;
        if (!existingIds.has(partner.id)) {
          // Создаём новый тред
          const profile: MockProfile = {
            id: partner.id,
            name: partner.name,
            age: partner.age ?? 0,
            city: partner.city ?? '',
            bio: partner.bio ?? '',
            photos: partner.photos.map(resolvePhotoUrl),
            interests: [],
            goal: '',
          };

          let lastMessage = 'Нет сообщений';
          if (match.lastMessage) {
            lastMessage = match.lastMessage.text || 'Сообщение';
            if (match.lastMessage.audioUrl) lastMessage = '🎙️ Голосовое';
            if (match.lastMessage.attachments?.length > 0) lastMessage = '📷 Фото';
          }

          newThreads.push({
            profile,
            messages: [],
            lastMessage,
            matchId: match.id,
          });
        }
      }

      if (newThreads.length === 0) return prev;
      return [...prev, ...newThreads];
    });
  }, [matchesList, currentUserId]);

  /* ─── Открытие чата ─── */

  const openChat = useCallback(
    (profile: MockProfile, matchId?: string) => {
      setThreads((prev) => {
        const existing = prev.find((t) => t.profile.id === profile.id);
        if (existing) {
          // Обновляем matchId, если передан
          if (matchId && !existing.matchId) {
            setActiveThreadId(existing.profile.id);
            return prev.map((t) =>
              t.profile.id === profile.id ? { ...t, matchId } : t,
            );
          }
          setActiveThreadId(existing.profile.id);
          return prev;
        }
        const newThread: ChatThread = {
          profile,
          messages: [],
          lastMessage: 'Вы поймали мэтч!',
          matchId,
        };
        setActiveThreadId(newThread.profile.id);
        return [...prev, newThread];
      });

      // Присоединяемся к комнате мэтча
      if (matchId) {
        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit('join_chat', { matchId });
        }
      }
    },
    [],
  );

  const closeChat = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const getActiveThread = useCallback((): ChatThread | null => {
    if (!activeThreadId) return null;
    return threads.find((t) => t.profile.id === activeThreadId) ?? null;
  }, [activeThreadId, threads]);

  /* ─── Загрузка истории сообщений ─── */

  const loadMessages = useCallback(
    async (matchId: string) => {
      try {
        const { data } = await http.get<{ messages: ApiMessage[] }>(
          `/api/matches/${matchId}/messages`,
          { params: { limit: 100 } },
        );

        if (!currentUserId) return;

        // Маппим сообщения и переворачиваем (API возвращает DESC)
        const messages = data.messages
          .map((m) => mapApiMessage(m, currentUserId))
          .reverse();

        // Обновляем тред
        setThreads((prev) =>
          prev.map((t) => {
            if (t.matchId !== matchId) return t;
            const lastMsg = messages[messages.length - 1];
            return {
              ...t,
              messages,
              lastMessage: lastMsg
                ? lastMsg.type === 'photo' ? '📷 Фото' :
                  lastMsg.type === 'voice' ? '🎙️ Голосовое' :
                  lastMsg.text || 'Сообщение'
                : 'Нет сообщений',
            };
          }),
        );
      } catch (err) {
        console.error('[ChatContext] Ошибка загрузки сообщений:', err);
      }
    },
    [currentUserId],
  );

  /* ─── Отправка текстового сообщения ─── */

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeThreadId || !text.trim()) return;

      const thread = threads.find((t) => t.profile.id === activeThreadId);
      if (!thread) return;

      const socket = socketRef.current;

      if (thread.matchId && socket?.connected) {
        // Отправляем через Socket.io
        socket.emit('send_message', {
          matchId: thread.matchId,
          text: text.trim(),
        });
      } else {
        // Fallback: локальное сообщение (для моков / оффлайна)
        const localMsg: ChatMessage = {
          id: `local_${Date.now()}`,
          text: text.trim(),
          sender: 'self',
          type: 'text',
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, localMsg],
              lastMessage: text.trim(),
            };
          }),
        );
      }
    },
    [activeThreadId, threads],
  );

  /* ─── Отправка фото ─── */

  const sendPhoto = useCallback(
    (url: string) => {
      if (!activeThreadId || !url.trim()) return;

      const thread = threads.find((t) => t.profile.id === activeThreadId);
      if (!thread) return;

      const socket = socketRef.current;

      if (thread.matchId && socket?.connected) {
        socket.emit('send_message', {
          matchId: thread.matchId,
          attachments: [url],
        });
      } else {
        const localMsg: ChatMessage = {
          id: `local_${Date.now()}`,
          text: '',
          sender: 'self',
          type: 'photo',
          photoUrl: url,
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, localMsg],
              lastMessage: '📷 Фото',
            };
          }),
        );
      }
    },
    [activeThreadId, threads],
  );

  /* ─── Отправка нескольких фото ─── */

  const sendPhotos = useCallback(
    (urls: string[]) => {
      if (!activeThreadId || urls.length === 0) return;

      const thread = threads.find((t) => t.profile.id === activeThreadId);
      if (!thread) return;

      const limited = urls.slice(0, 10);
      const socket = socketRef.current;

      if (thread.matchId && socket?.connected) {
        socket.emit('send_message', {
          matchId: thread.matchId,
          attachments: limited,
        });
      } else {
        const localMsg: ChatMessage = {
          id: `local_${Date.now()}`,
          text: '',
          sender: 'self',
          type: 'photo',
          photoUrls: limited,
          photoUrl: limited.length === 1 ? limited[0] : undefined,
          timestamp: Date.now(),
        };
        const label = limited.length === 1 ? '📷 Фото' : `📷 ${limited.length} фото`;
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, localMsg],
              lastMessage: label,
            };
          }),
        );
      }
    },
    [activeThreadId, threads],
  );

  /* ─── Отправка голосового ─── */

  const sendVoice = useCallback(
    (duration: number, audioUrl: string) => {
      if (!activeThreadId) return;

      const thread = threads.find((t) => t.profile.id === activeThreadId);
      if (!thread) return;

      const socket = socketRef.current;

      if (thread.matchId && socket?.connected) {
        socket.emit('send_message', {
          matchId: thread.matchId,
          audioUrl,
          duration,
        });
      } else {
        const localMsg: ChatMessage = {
          id: `local_${Date.now()}`,
          text: '',
          sender: 'self',
          type: 'voice',
          voiceDuration: duration,
          audioUrl,
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, localMsg],
              lastMessage: '🎙️ Голосовое',
            };
          }),
        );
      }
    },
    [activeThreadId, threads],
  );

  // Слушаем кастомное событие на удаление треда (unmatch)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ profileId: string }>).detail;
      if (!detail?.profileId) return;
      const pid = detail.profileId;
      setThreads((prev) => prev.filter((t) => t.profile.id !== pid));
      setActiveThreadId((prev) => (prev === pid ? null : prev));
    };
    window.addEventListener('datesphere:removeThread', handler);
    return () => window.removeEventListener('datesphere:removeThread', handler);
  }, []);

  const shareTelegram = useCallback(() => {
    if (!activeThreadId) return;

    const username = '@durov';
    const systemMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      text: `[${userName}] поделился контактом: ${username}`,
      sender: 'self',
      type: 'system',
      timestamp: Date.now(),
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.profile.id !== activeThreadId) return t;
        return {
          ...t,
          messages: [...t.messages, systemMsg],
          lastMessage: `Поделился контактом: ${username}`,
        };
      }),
    );
  }, [activeThreadId, userName]);

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThreadId,
        openChat,
        closeChat,
        sendMessage,
        sendPhoto,
        sendPhotos,
        sendVoice,
        shareTelegram,
        getActiveThread,
        loadMessages,
        typingUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within <ChatProvider>');
  }
  return ctx;
}
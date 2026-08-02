import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { MockProfile } from '../features/swipes/mockProfiles';
import { useRegistration } from './RegistrationContext';

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
}

interface ChatContextValue {
  threads: ChatThread[];
  activeThreadId: string | null;
  openChat: (profile: MockProfile) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  sendPhoto: (url: string) => void;
  sendPhotos: (urls: string[]) => void;
  sendVoice: (duration: number, audioUrl: string) => void;
  shareTelegram: () => void;
  getActiveThread: () => ChatThread | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Ответы для эмуляции
const BOT_REPLIES = [
  'Привет! Классная анкета, чем занимаешься?',
  'Приветик) Рад(а) мэтчу!',
  'Ого, у нас много общего! Как настроение?',
  'Давай поболтаем! Что любишь делать в свободное время?',
  'Круто! А ты давно пользуешься этим приложением?',
  'Хах, у тебя забавное био! Расскажешь подробнее о себе?',
];

// Тестовые изображения для фотовложений
const TEST_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
];

let nextMsgId = 0;
function genId(): string {
  nextMsgId += 1;
  return `msg_${nextMsgId}_${Date.now()}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // Читаем имя пользователя для персонализации системных сообщений
  const registration = useRegistration();
  const userName = registration.form.name || 'Ты';

  const openChat = useCallback((profile: MockProfile) => {
    setThreads((prev) => {
      const existing = prev.find((t) => t.profile.id === profile.id);
      if (existing) {
        setActiveThreadId(existing.profile.id);
        return prev;
      }
      const newThread: ChatThread = {
        profile,
        messages: [],
        lastMessage: 'Вы поймали мэтч!',
      };
      setActiveThreadId(newThread.profile.id);
      return [...prev, newThread];
    });
  }, []);

  const closeChat = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const getActiveThread = useCallback((): ChatThread | null => {
    if (!activeThreadId) return null;
    return threads.find((t) => t.profile.id === activeThreadId) ?? null;
  }, [activeThreadId, threads]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeThreadId || !text.trim()) return;

      const userMsg: ChatMessage = {
        id: genId(),
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
            messages: [...t.messages, userMsg],
            lastMessage: text.trim(),
          };
        }),
      );

      // Эмуляция ответа через 1.5–2 секунды
      setTimeout(() => {
        const botText = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
        const botMsg: ChatMessage = {
          id: genId(),
          text: botText,
          sender: 'other',
          type: 'text',
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, botMsg],
              lastMessage: botText,
            };
          }),
        );
      }, 1500 + Math.random() * 500);
    },
    [activeThreadId],
  );

  const sendPhoto = useCallback(
    (url: string) => {
      if (!activeThreadId || !url.trim()) return;

      const userMsg: ChatMessage = {
        id: genId(),
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
            messages: [...t.messages, userMsg],
            lastMessage: '📷 Фото',
          };
        }),
      );

      // Эмуляция ответа через 2–3 секунды
      setTimeout(() => {
        const replyUrl = TEST_PHOTO_URLS[Math.floor(Math.random() * TEST_PHOTO_URLS.length)];
        const botMsg: ChatMessage = {
          id: genId(),
          text: '',
          sender: 'other',
          type: 'photo',
          photoUrl: replyUrl,
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, botMsg],
              lastMessage: '📷 Фото',
            };
          }),
        );
      }, 2000 + Math.random() * 1000);
    },
    [activeThreadId],
  );

  const sendPhotos = useCallback(
    (urls: string[]) => {
      if (!activeThreadId || urls.length === 0) return;

      const limited = urls.slice(0, 10);
      const userMsg: ChatMessage = {
        id: genId(),
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
            messages: [...t.messages, userMsg],
            lastMessage: label,
          };
        }),
      );

      // Эмуляция ответа через 2–3 секунды
      setTimeout(() => {
        const replyUrl = TEST_PHOTO_URLS[Math.floor(Math.random() * TEST_PHOTO_URLS.length)];
        const botMsg: ChatMessage = {
          id: genId(),
          text: '',
          sender: 'other',
          type: 'photo',
          photoUrl: replyUrl,
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, botMsg],
              lastMessage: '📷 Фото',
            };
          }),
        );
      }, 2000 + Math.random() * 1000);
    },
    [activeThreadId],
  );

  const sendVoice = useCallback(
    (duration: number, audioUrl: string) => {
      if (!activeThreadId) return;

      const userMsg: ChatMessage = {
        id: genId(),
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
            messages: [...t.messages, userMsg],
            lastMessage: '🎙️ Голосовое',
          };
        }),
      );

      // Эмуляция голосового ответа через 2–3 секунды
      setTimeout(() => {
        const replyDuration = 5 + Math.floor(Math.random() * 25);
        const botMsg: ChatMessage = {
          id: genId(),
          text: '',
          sender: 'other',
          type: 'voice',
          voiceDuration: replyDuration,
          audioUrl: '',
          timestamp: Date.now(),
        };
        setThreads((prev) =>
          prev.map((t) => {
            if (t.profile.id !== activeThreadId) return t;
            return {
              ...t,
              messages: [...t.messages, botMsg],
              lastMessage: '🎙️ Голосовое',
            };
          }),
        );
      }, 2000 + Math.random() * 1000);
    },
    [activeThreadId],
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
      id: genId(),
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
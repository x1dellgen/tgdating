import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useRegistration } from './RegistrationContext';
import { useMatch } from './MatchContext';
import { calculateAge } from '../shared/constants';
import { mockProfiles, type MockProfile } from '../features/swipes/mockProfiles';
import type { Gender } from '../shared/constants';
import { getSocket } from '../api/client';
import type { Socket } from 'socket.io-client';

/* ─── Типы ─── */

export type AnonymousStatus = 'setup' | 'searching' | 'chatting' | 'stopped-search' | 'stopped-chat';

export type AnonMessageType = 'text' | 'system' | 'profile-card' | 'image' | 'voice';

export interface ReplyTo {
  id: string;
  text: string;
  sender: 'self' | 'other';
}

export interface AnonMessage {
  id: string;
  text: string;
  sender: 'self' | 'other';
  type: AnonMessageType;
  timestamp: number;
  profile?: MockProfile;
  content?: string;
  replyTo?: ReplyTo;
  voiceDuration?: number;
  audioUrl?: string;
}

export interface AnonSettings {
  selfGender: 'male' | 'female';
  selfAge: string;
  anonymousInterests: string[];
  isAdultMode: boolean;
}

const ANON_SETTINGS_KEY = 'dateme_anon_settings';

/* ─── Вспомогательные утилиты ─── */

let nextAnonMsgId = 0;
export function genAnonId(): string {
  nextAnonMsgId += 1;
  return `anon_${nextAnonMsgId}_${Date.now()}`;
}

function getAgeGroup(age: number): 'teen' | 'adult' {
  return age >= 14 && age <= 17 ? 'teen' : 'adult';
}

function loadAnonSettings(): AnonSettings | null {
  try {
    const raw = localStorage.getItem(ANON_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.selfGender === 'male' || parsed.selfGender === 'female') &&
      typeof parsed.selfAge === 'string' &&
      Array.isArray(parsed.anonymousInterests)
    ) {
      return {
        selfGender: parsed.selfGender,
        selfAge: parsed.selfAge,
        anonymousInterests: parsed.anonymousInterests,
        isAdultMode: parsed.isAdultMode === true,
      } as AnonSettings;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAnonSettings(settings: AnonSettings): void {
  try {
    localStorage.setItem(ANON_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // silently ignore
  }
}

/* ─── Фразы (fallback для оффлайна) ─── */

export const ANON_REPLIES = [
  'Привет! Как настроение?',
  'Приветик :) Давай поболтаем!',
  'О, привет! Чем занимаешься?',
  'Здарова! Расскажи что-нибудь интересное',
  'Привет-привет! Как жизнь?',
  'Хэй! Всегда рад(а) новым знакомствам',
  'Добрый вечер! О чём хочешь поговорить?',
  'Привет! Люблю анонимные чаты — никаких предрассудков',
];

export const PROFILE_SHARE_REPLIES = [
  'Ого, классная анкета! Вот моя 👇',
  'Круто! Держи мою анкету тоже 😊',
  'Вау, ты интересный человек! Вот мой профиль',
  'Супер! Давай знакомиться ближе, вот моя анкета',
];

export const PHOTO_REPLIES = [
  'Ого, крутое фото!',
  'Класс!',
  'Вау, здорово выглядит!',
  'Супер! 👍',
  'Красота!',
];

/* ─── Контекст ─── */

interface AnonymousChatContextValue {
  status: AnonymousStatus;
  setStatus: (s: AnonymousStatus) => void;
  searchGender: Gender;
  setSearchGender: (g: Gender) => void;
  matchedProfile: MockProfile | null;
  setMatchedProfile: (p: MockProfile | null) => void;
  messages: AnonMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AnonMessage[]>>;
  inputText: string;
  setInputText: (t: string) => void;
  hasSharedProfile: boolean;
  setHasSharedProfile: (v: boolean) => void;
  selfGender: 'male' | 'female';
  setSelfGender: (g: 'male' | 'female') => void;
  selfAge: string;
  setSelfAge: (a: string) => void;
  anonymousInterests: string[];
  setAnonymousInterests: React.Dispatch<React.SetStateAction<string[]>>;
  isAdultMode: boolean;
  setIsAdultMode: (v: boolean) => void;
  showInterests: boolean;
  setShowInterests: (v: boolean) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  showActionSheet: boolean;
  setShowActionSheet: (v: boolean) => void;
  showTelegramInput: boolean;
  setShowTelegramInput: (v: boolean) => void;
  telegramUsername: string | null;
  setTelegramUsername: (u: string | null) => void;
  showNoProfileModal: boolean;
  setShowNoProfileModal: (v: boolean) => void;
  replyToMessage: ReplyTo | null;
  setReplyToMessage: (r: ReplyTo | null) => void;
  hasProfile: boolean;
  hasSavedAnonSettings: boolean;
  userAgeGroup: 'teen' | 'adult';
  isAdult: boolean;
  // Actions
  startSearching: () => void;
  stopSearching: () => void;
  resumeSearching: () => void;
  sendMessage: () => void;
  nextPartner: () => void;
  endChat: () => void;
  shareProfile: () => void;
  shareProfileAndAutoSend: (profileData: { name: string; gender: string; age: string; photo: string }) => void;
  shareTelegram: () => void;
  handleTelegramSave: (username: string) => void;
  complain: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleReplyToMessage: (msg: AnonMessage) => void;
  sendVoice: (duration: number, audioUrl: string) => void;
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  // Confirm modal for leaving
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  pendingNavigation: (() => void) | null;
  setPendingNavigation: (cb: (() => void) | null) => void;
  // Viewing dating profile from anon chat
  viewDatingProfile: MockProfile | null;
  setViewDatingProfile: (p: MockProfile | null) => void;
}

const AnonymousChatContext = createContext<AnonymousChatContextValue | null>(null);

export function AnonymousChatProvider({ children }: { children: ReactNode }) {
  const { form } = useRegistration();
  const { addLike } = useMatch();

  const savedSettings = useMemo(() => loadAnonSettings(), []);

  /* ── Стейт ── */
  const [status, setStatus] = useState<AnonymousStatus>('setup');
  const [searchGender, setSearchGender] = useState<Gender>('all');
  const [matchedProfile, setMatchedProfile] = useState<MockProfile | null>(null);
  const [messages, setMessages] = useState<AnonMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [hasSharedProfile, setHasSharedProfile] = useState(false);

  const [selfGender, setSelfGender] = useState<'male' | 'female'>(
    savedSettings?.selfGender ?? 'male',
  );
  const [selfAge, setSelfAge] = useState<string>(savedSettings?.selfAge ?? '');
  const [anonymousInterests, setAnonymousInterests] = useState<string[]>(
    savedSettings?.anonymousInterests ?? [],
  );
  const [isAdultMode, setIsAdultMode] = useState<boolean>(
    savedSettings?.isAdultMode ?? false,
  );
  const [showInterests, setShowInterests] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [showNoProfileModal, setShowNoProfileModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ReplyTo | null>(null);

  // Confirm modal для выхода
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Просмотр профиля дейтинга из анонимного чата
  const [viewDatingProfile, setViewDatingProfile] = useState<MockProfile | null>(null);

  // ID анонимной сессии на бэкенде
  const sessionIdRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /* ── Чтение профиля напрямую из localStorage (реактивное) ── */
  function readHasProfile(): boolean {
    try {
      const raw = localStorage.getItem('dateme_user_profile');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.photos) &&
        parsed.photos.length > 0 &&
        typeof parsed.name === 'string' &&
        parsed.name.trim().length > 0
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const [hasProfile, setHasProfile] = useState<boolean>(readHasProfile);

  useEffect(() => {
    const onStorage = () => setHasProfile(readHasProfile());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasSavedAnonSettings = savedSettings !== null && !hasProfile;

  /* ── Проверка совершеннолетия: профиль ИЛИ ручной ввод ── */
  const isAdult = useMemo(() => {
    if (hasProfile) {
      if (form.birthDate) {
        return calculateAge(form.birthDate) >= 18;
      }
      try {
        const raw = localStorage.getItem('dateme_user_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.birthDate) {
            return calculateAge(parsed.birthDate) >= 18;
          }
        }
      } catch { /* ignore */ }
      return true; // профиль есть — считаем взрослым по умолчанию
    }
    const ageNum = parseInt(selfAge, 10);
    return !isNaN(ageNum) && ageNum >= 18;
  }, [hasProfile, form.birthDate, selfAge]);

  /* ── Пол и возраст из профиля для поиска ── */
  const userAgeGroup = useMemo<'teen' | 'adult'>(() => {
    if (form.birthDate) {
      const age = calculateAge(form.birthDate);
      return getAgeGroup(age);
    }
    const ageNum = parseInt(selfAge, 10);
    if (!isNaN(ageNum) && ageNum >= 14 && ageNum <= 99) {
      return getAgeGroup(ageNum);
    }
    return 'adult';
  }, [form.birthDate, selfAge]);

  /* ── Автоскролл ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Очистка таймеров при размонтировании ── */
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      if (shareReplyTimerRef.current) clearTimeout(shareReplyTimerRef.current);
    };
  }, []);

  /* ── Сохранение настроек при изменении ── */
  useEffect(() => {
    if (!hasProfile) {
      saveAnonSettings({ selfGender, selfAge, anonymousInterests, isAdultMode });
    }
  }, [hasProfile, selfGender, selfAge, anonymousInterests, isAdultMode]);

  /* ─── Socket.io: подключение и обработчики событий ─── */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    // Обработчики анонимного чата
    const onMatchFound = (data: { sessionId: string; partnerInfo: { id: string; name: string; age: number | null; gender: string | null } | null }) => {
      sessionIdRef.current = data.sessionId;

      // Создаём MockProfile из partnerInfo
      const partner = data.partnerInfo;
      const profile: MockProfile = partner
        ? {
            id: partner.id,
            name: partner.name || 'Аноним',
            age: partner.age ?? 0,
            city: '',
            bio: '',
            photos: [],
            interests: [],
            goal: '',
            isAdult: (partner.age ?? 0) >= 18,
          }
        : {
            id: `anon_${data.sessionId}`,
            name: 'Аноним',
            age: 0,
            city: '',
            bio: '',
            photos: [],
            interests: [],
            goal: '',
          };

      setMatchedProfile(profile);
      setStatus('chatting');

      // Приветственное сообщение
      const welcomeMsg: AnonMessage = {
        id: genAnonId(),
        text: 'Вы подключены к собеседнику. Приятного общения!',
        sender: 'self',
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
    };

    const onSearchQueued = (_data: { position: number }) => {
      // Уже в стейте searching — ничего не меняем
    };

    const onNewAnonMessage = (data: {
      id: string;
      sessionId: string;
      senderId: string;
      text: string | null;
      attachments: string[];
      audioUrl: string | null;
      duration: number | null;
      createdAt: string;
    }) => {
      const msg: AnonMessage = {
        id: data.id,
        text: data.text || '',
        sender: 'other',
        type: data.attachments?.length > 0 ? 'image' : data.audioUrl ? 'voice' : 'text',
        timestamp: new Date(data.createdAt).getTime(),
        voiceDuration: data.duration ?? undefined,
        audioUrl: data.audioUrl ?? undefined,
      };
      setMessages((prev) => [...prev, msg]);
    };

    const onPartnerLeft = () => {
      const sysMsg: AnonMessage = {
        id: genAnonId(),
        text: '[Собеседник покинул чат]',
        sender: 'self',
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, sysMsg]);
      setStatus('stopped-chat');
    };

    const onSearchCancelled = () => {
      setStatus('setup');
    };

    socket.on('anon_match_found', onMatchFound);
    socket.on('anon_search_queued', onSearchQueued);
    socket.on('new_anon_message', onNewAnonMessage);
    socket.on('anon_partner_left', onPartnerLeft);
    socket.on('anon_search_cancelled', onSearchCancelled);

    return () => {
      socket.off('anon_match_found', onMatchFound);
      socket.off('anon_search_queued', onSearchQueued);
      socket.off('new_anon_message', onNewAnonMessage);
      socket.off('anon_partner_left', onPartnerLeft);
      socket.off('anon_search_cancelled', onSearchCancelled);
    };
  }, []);

  /* ── Фильтрация профилей (fallback для оффлайна) ── */
  const getFilteredProfiles = useCallback((): MockProfile[] => {
    const maleNames = ['Дмитрий', 'Алексей', 'Сергей', 'Максим', 'Артём'];
    const femaleNames = ['Анна', 'Екатерина', 'Мария', 'Ольга', 'Алиса', 'Полина', 'Виктория'];

    const filtered = mockProfiles.filter((p) => {
      const profileGroup = getAgeGroup(p.age);
      if (profileGroup !== userAgeGroup) return false;
      if (searchGender === 'male' && femaleNames.includes(p.name)) return false;
      if (searchGender === 'female' && maleNames.includes(p.name)) return false;
      if (isAdultMode && userAgeGroup === 'adult') {
        if (!p.isAdult) return false;
        if (!p.interests.includes('Ролевые игры')) return false;
      }
      return true;
    });

    if (anonymousInterests.length > 0) {
      filtered.sort((a, b) => {
        const aMatches = a.interests.filter((i) => anonymousInterests.includes(i)).length;
        const bMatches = b.interests.filter((i) => anonymousInterests.includes(i)).length;
        return bMatches - aMatches;
      });
    }

    return filtered;
  }, [searchGender, userAgeGroup, anonymousInterests, isAdultMode]);

  /* ── Выбор случайного профиля (fallback) ── */
  const pickRandomProfile = useCallback((): MockProfile | null => {
    const filtered = getFilteredProfiles();
    if (filtered.length === 0) return null;

    if (anonymousInterests.length > 0) {
      const topMatches = filtered.filter(
        (p) => p.interests.some((i) => anonymousInterests.includes(i)),
      );
      if (topMatches.length > 0) {
        if (Math.random() < 0.7) {
          return topMatches[Math.floor(Math.random() * topMatches.length)];
        }
      }
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [getFilteredProfiles, anonymousInterests]);

  /* ── Начать поиск (Socket.io + fallback) ── */
  const startSearching = useCallback(() => {
    setStatus('searching');
    setMessages([]);
    setMatchedProfile(null);
    setHasSharedProfile(false);
    setReplyToMessage(null);
    sessionIdRef.current = null;

    const socket = socketRef.current;

    if (socket?.connected) {
      // Отправляем запрос на поиск через Socket.io
      socket.emit('start_anon_search', {
        targetGender: searchGender,
        topic: anonymousInterests[0] || 'general',
      });
    } else {
      // Fallback: моковый поиск (оффлайн / dev-режим)
      const delay = 3000 + Math.random() * 1000;
      searchTimerRef.current = setTimeout(() => {
        const profile = pickRandomProfile();
        if (profile) {
          setMatchedProfile(profile);
          setStatus('chatting');
        } else {
          setStatus('setup');
        }
      }, delay);
    }
  }, [searchGender, anonymousInterests, pickRandomProfile]);

  /* ── Остановить поиск ── */
  const stopSearching = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('cancel_anon_search');
    }

    setStatus('stopped-search');
  }, []);

  /* ── Перезапустить поиск ── */
  const resumeSearching = useCallback(() => {
    setStatus('searching');

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('start_anon_search', {
        targetGender: searchGender,
        topic: anonymousInterests[0] || 'general',
      });
    } else {
      const delay = 3000 + Math.random() * 1000;
      searchTimerRef.current = setTimeout(() => {
        const profile = pickRandomProfile();
        if (profile) {
          setMatchedProfile(profile);
          setStatus('chatting');
        } else {
          setStatus('setup');
        }
      }, delay);
    }
  }, [searchGender, anonymousInterests, pickRandomProfile]);

  /* ── Отправить текст (Socket.io + fallback) ── */
  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !matchedProfile) return;

    const currentReply = replyToMessage;

    const userMsg: AnonMessage = {
      id: genAnonId(),
      text,
      sender: 'self',
      type: 'text',
      timestamp: Date.now(),
      ...(currentReply ? { replyTo: currentReply } : {}),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setReplyToMessage(null);

    const socket = socketRef.current;

    if (socket?.connected && sessionIdRef.current) {
      // Отправляем через Socket.io
      socket.emit('send_anon_message', {
        sessionId: sessionIdRef.current,
        text,
      });
    } else {
      // Fallback: эмуляция ответа
      replyTimerRef.current = setTimeout(() => {
        const reply = ANON_REPLIES[Math.floor(Math.random() * ANON_REPLIES.length)];
        const shouldReplyWithQuote = Math.random() < 0.33;

        const botMsg: AnonMessage = {
          id: genAnonId(),
          text: reply,
          sender: 'other',
          type: 'text',
          timestamp: Date.now(),
          ...(shouldReplyWithQuote
            ? {
                replyTo: {
                  id: userMsg.id,
                  text: userMsg.text,
                  sender: 'self' as const,
                },
              }
            : {}),
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 1500 + Math.random() * 500);
    }
  }, [inputText, matchedProfile, replyToMessage]);

  /* ── Следующий собеседник ── */
  const nextPartner = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (shareReplyTimerRef.current) clearTimeout(shareReplyTimerRef.current);

    // Покидаем текущую сессию
    const socket = socketRef.current;
    if (socket?.connected && sessionIdRef.current) {
      socket.emit('leave_anon_chat', { sessionId: sessionIdRef.current });
    }

    setMessages([]);
    setMatchedProfile(null);
    setHasSharedProfile(false);
    setReplyToMessage(null);
    sessionIdRef.current = null;
    setStatus('searching');

    // Запускаем новый поиск
    if (socket?.connected) {
      socket.emit('start_anon_search', {
        targetGender: searchGender,
        topic: anonymousInterests[0] || 'general',
      });
    } else {
      const delay = 3000 + Math.random() * 1000;
      searchTimerRef.current = setTimeout(() => {
        const profile = pickRandomProfile();
        if (profile) {
          setMatchedProfile(profile);
          setStatus('chatting');
        } else {
          setStatus('setup');
        }
      }, delay);
    }
  }, [searchGender, anonymousInterests, pickRandomProfile]);

  /* ── Завершить диалог ── */
  const endChat = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (shareReplyTimerRef.current) clearTimeout(shareReplyTimerRef.current);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // Уведомляем бэкенд
    const socket = socketRef.current;
    if (socket?.connected && sessionIdRef.current) {
      socket.emit('leave_anon_chat', { sessionId: sessionIdRef.current });
    }

    const endMsg: AnonMessage = {
      id: genAnonId(),
      text: '[Вы завершили диалог]',
      sender: 'self',
      type: 'system',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, endMsg]);
    setStatus('stopped-chat');
  }, []);

  /* ── Поделиться анкетой ── */
  const shareProfile = useCallback(() => {
    if (!matchedProfile) return;

    if (!hasProfile) {
      setShowNoProfileModal(true);
      return;
    }

    addLike(matchedProfile.id);

    const shareMsg: AnonMessage = {
      id: genAnonId(),
      text: '[Вы поделились своей анкетой знакомств]',
      sender: 'self',
      type: 'system',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, shareMsg]);
    setHasSharedProfile(true);

    shareReplyTimerRef.current = setTimeout(() => {
      const replyText = PROFILE_SHARE_REPLIES[Math.floor(Math.random() * PROFILE_SHARE_REPLIES.length)];
      const textMsg: AnonMessage = {
        id: genAnonId(),
        text: replyText,
        sender: 'other',
        type: 'text',
        timestamp: Date.now(),
      };
      const cardMsg: AnonMessage = {
        id: genAnonId(),
        text: '',
        sender: 'other',
        type: 'profile-card',
        timestamp: Date.now(),
        profile: matchedProfile,
      };
      setMessages((prev) => [...prev, textMsg, cardMsg]);
    }, 2000);
  }, [matchedProfile, hasProfile, addLike]);

  /* ── Быстрое создание анкеты + авто-отправка в чат ── */
  const shareProfileAndAutoSend = useCallback(
    (profileData: { name: string; gender: string; age: string; photo: string }) => {
      const profile = {
        name: profileData.name,
        gender: profileData.gender,
        birthDate: null,
        city: '',
        bio: '',
        photos: [profileData.photo],
        interests: [],
        relationshipGoals: [],
        searchingFor: {
          gender: 'all' as const,
          ageRange: [18, 99] as [number, number],
          city: '',
          searchEverywhere: false,
        },
      };
      try {
        localStorage.setItem('dateme_user_profile', JSON.stringify(profile));
        setHasProfile(true);
      } catch {
        // silently ignore
      }

      if (matchedProfile && (status === 'chatting' || status === 'stopped-chat')) {
        addLike(matchedProfile.id);

        const shareMsg: AnonMessage = {
          id: genAnonId(),
          text: '[Вы поделились своей анкетой знакомств]',
          sender: 'self',
          type: 'system',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, shareMsg]);
        setHasSharedProfile(true);

        shareReplyTimerRef.current = setTimeout(() => {
          const replyText = PROFILE_SHARE_REPLIES[Math.floor(Math.random() * PROFILE_SHARE_REPLIES.length)];
          const textMsg: AnonMessage = {
            id: genAnonId(),
            text: replyText,
            sender: 'other',
            type: 'text',
            timestamp: Date.now(),
          };
          const cardMsg: AnonMessage = {
            id: genAnonId(),
            text: '',
            sender: 'other',
            type: 'profile-card',
            timestamp: Date.now(),
            profile: matchedProfile,
          };
          setMessages((prev) => [...prev, textMsg, cardMsg]);
        }, 2000);
      }
    },
    [matchedProfile, status, addLike],
  );

  /* ── Поделиться Telegram ── */
  const shareTelegram = useCallback(() => {
    if (!matchedProfile) return;

    const doShare = (username: string) => {
      const tgMsg: AnonMessage = {
        id: genAnonId(),
        text: `[Собеседник поделился контактом Telegram: @${username}]`,
        sender: 'self',
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tgMsg]);
    };

    if (telegramUsername) {
      doShare(telegramUsername);
    } else {
      setShowTelegramInput(true);
    }
  }, [matchedProfile, telegramUsername]);

  const handleTelegramSave = useCallback(
    (username: string) => {
      setTelegramUsername(username);
      setShowTelegramInput(false);
      if (matchedProfile) {
        const tgMsg: AnonMessage = {
          id: genAnonId(),
          text: `[Собеседник поделился контактом Telegram: @${username}]`,
          sender: 'self',
          type: 'system',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, tgMsg]);
      }
    },
    [matchedProfile],
  );

  /* ── Отправить голосовое (Socket.io + fallback) ── */
  const sendVoice = useCallback(
    (duration: number, audioUrl: string) => {
      if (!matchedProfile) return;

      const voiceMsg: AnonMessage = {
        id: genAnonId(),
        text: '',
        sender: 'self',
        type: 'voice',
        timestamp: Date.now(),
        voiceDuration: duration,
        audioUrl,
      };
      setMessages((prev) => [...prev, voiceMsg]);

      const socket = socketRef.current;

      if (socket?.connected && sessionIdRef.current) {
        socket.emit('send_anon_message', {
          sessionId: sessionIdRef.current,
          audioUrl,
          duration,
        });
      } else {
        // Fallback
        replyTimerRef.current = setTimeout(() => {
          const reply = ANON_REPLIES[Math.floor(Math.random() * ANON_REPLIES.length)];
          const botMsg: AnonMessage = {
            id: genAnonId(),
            text: reply,
            sender: 'other',
            type: 'text',
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, botMsg]);
        }, 2000 + Math.random() * 1000);
      }
    },
    [matchedProfile],
  );

  /* ── Пожаловаться ── */
  const complain = useCallback(() => {
    alert('Жалоба отправлена');
  }, []);

  /* ── Отправка изображения (Socket.io + fallback) ── */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !matchedProfile) return;

      if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) {
        e.target.value = '';
        return;
      }

      const currentReply = replyToMessage;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const imgMsg: AnonMessage = {
          id: genAnonId(),
          text: '',
          sender: 'self',
          type: 'image',
          timestamp: Date.now(),
          content: base64,
          ...(currentReply ? { replyTo: currentReply } : {}),
        };
        setMessages((prev) => [...prev, imgMsg]);
        setReplyToMessage(null);

        // В Socket.io-режиме отправляем как attachment
        const socket = socketRef.current;
        if (socket?.connected && sessionIdRef.current) {
          socket.emit('send_anon_message', {
            sessionId: sessionIdRef.current,
            attachments: [base64],
          });
        } else {
          // Fallback
          replyTimerRef.current = setTimeout(() => {
            const reply = PHOTO_REPLIES[Math.floor(Math.random() * PHOTO_REPLIES.length)];
            const shouldReplyWithQuote = Math.random() < 0.33;
            const botMsg: AnonMessage = {
              id: genAnonId(),
              text: reply,
              sender: 'other',
              type: 'text',
              timestamp: Date.now(),
              ...(shouldReplyWithQuote
                ? {
                    replyTo: {
                      id: imgMsg.id,
                      text: '',
                      sender: 'self' as const,
                    },
                  }
                : {}),
            };
            setMessages((prev) => [...prev, botMsg]);
          }, 2000);
        }
      };
      reader.readAsDataURL(file);

      e.target.value = '';
    },
    [matchedProfile, replyToMessage],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /* ── Обработка Enter ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  /* ── Обработчик реплая ── */
  const handleReplyToMessage = useCallback((msg: AnonMessage) => {
    const replyText = msg.type === 'image' ? '' : msg.text;
    setReplyToMessage({
      id: msg.id,
      text: replyText,
      sender: msg.sender,
    });
  }, []);

  return (
    <AnonymousChatContext.Provider
      value={{
        status, setStatus,
        searchGender, setSearchGender,
        matchedProfile, setMatchedProfile,
        messages, setMessages,
        inputText, setInputText,
        hasSharedProfile, setHasSharedProfile,
        selfGender, setSelfGender,
        selfAge, setSelfAge,
        anonymousInterests, setAnonymousInterests,
        isAdultMode, setIsAdultMode,
        showInterests, setShowInterests,
        editMode, setEditMode,
        showActionSheet, setShowActionSheet,
        showTelegramInput, setShowTelegramInput,
        telegramUsername, setTelegramUsername,
        showNoProfileModal, setShowNoProfileModal,
        replyToMessage, setReplyToMessage,
        hasProfile, hasSavedAnonSettings, userAgeGroup, isAdult,
        startSearching, stopSearching, resumeSearching,
        sendMessage, nextPartner, endChat,
        shareProfile, shareProfileAndAutoSend,
        shareTelegram, handleTelegramSave,
        complain, handleFileSelect, triggerFileInput,
        handleKeyDown, handleReplyToMessage, sendVoice,
        messagesEndRef, inputRef, fileInputRef,
        showExitConfirm, setShowExitConfirm,
        pendingNavigation, setPendingNavigation,
        viewDatingProfile, setViewDatingProfile,
      }}
    >
      {children}
    </AnonymousChatContext.Provider>
  );
}

export function useAnonymousChat(): AnonymousChatContextValue {
  const ctx = useContext(AnonymousChatContext);
  if (!ctx) {
    throw new Error('useAnonymousChat must be used within <AnonymousChatProvider>');
  }
  return ctx;
}
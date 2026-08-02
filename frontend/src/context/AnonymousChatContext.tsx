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

/* ─── Фразы ─── */

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── Фильтрация профилей ── */
  const getFilteredProfiles = useCallback((): MockProfile[] => {
    const maleNames = ['Дмитрий', 'Алексей', 'Сергей', 'Максим', 'Артём'];
    const femaleNames = ['Анна', 'Екатерина', 'Мария', 'Ольга', 'Алиса', 'Полина', 'Виктория'];

    const filtered = mockProfiles.filter((p) => {
      const profileGroup = getAgeGroup(p.age);
      if (profileGroup !== userAgeGroup) return false;
      if (searchGender === 'male' && femaleNames.includes(p.name)) return false;
      if (searchGender === 'female' && maleNames.includes(p.name)) return false;
      // Adult Mode filter: only match profiles with isAdult=true and "Ролевые игры" interest
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

  /* ── Выбор случайного профиля ── */
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

  /* ── Начать поиск ── */
  const startSearching = useCallback(() => {
    setStatus('searching');
    setMessages([]);
    setMatchedProfile(null);
    setHasSharedProfile(false);
    setReplyToMessage(null);

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
  }, [pickRandomProfile]);

  /* ── Остановить поиск (из радара) ── */
  const stopSearching = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setStatus('stopped-search');
  }, []);

  /* ── Перезапустить поиск ── */
  const resumeSearching = useCallback(() => {
    setStatus('searching');
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
  }, [pickRandomProfile]);

  /* ── Отправить текст ── */
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
  }, [inputText, matchedProfile, replyToMessage]);

  /* ── Следующий собеседник ── */
  const nextPartner = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (shareReplyTimerRef.current) clearTimeout(shareReplyTimerRef.current);

    setMessages([]);
    setMatchedProfile(null);
    setHasSharedProfile(false);
    setReplyToMessage(null);
    setStatus('searching');

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
  }, [pickRandomProfile]);

  /* ── Завершить диалог ── */
  const endChat = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (shareReplyTimerRef.current) clearTimeout(shareReplyTimerRef.current);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

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

    // Авто-лайк при шеринге: регистрируем лайк к боту в MatchContext
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
      // Create the profile in localStorage
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
        setHasProfile(true); // same-tab activation: storage event won't fire
      } catch {
        // silently ignore
      }

      // Auto-send profile card in chat if chatting
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

  /* ── Отправить голосовое ── */
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

      // Эмуляция ответа
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
    },
    [matchedProfile],
  );

  /* ── Пожаловаться ── */
  const complain = useCallback(() => {
    alert('Жалоба отправлена');
  }, []);

  /* ── Отправка изображения ── */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !matchedProfile) return;

      // Валидация типа и размера (15 МБ)
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
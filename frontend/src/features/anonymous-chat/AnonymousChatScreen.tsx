import { useState, useRef, useEffect, useCallback } from 'react';
import { useScreen } from '../../context/ScreenContext';
import { useMatch } from '../../context/MatchContext';
import { useAnonymousChat } from '../../context/AnonymousChatContext';
import type { AnonMessage, ReplyTo } from '../../context/AnonymousChatContext';
import { AVAILABLE_INTERESTS } from '../../shared/constants';
import type { MockProfile } from '../swipes/mockProfiles';

/* ─── Иконки ─── */

function RadarIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="28" />
      <circle cx="32" cy="32" r="18" />
      <circle cx="32" cy="32" r="8" />
      <line x1="32" y1="4" x2="32" y2="60" />
      <line x1="4" y1="32" x2="60" y2="32" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

function AnonymousAvatar({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="18" />
      <circle cx="20" cy="15" r="7" />
      <path d="M6 34c0-7.7 6.3-14 14-14s14 6.3 14 14" />
    </svg>
  );
}

function SendIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function MenuIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function ClipIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}


function TelegramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.626-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.46-1.901-.903-1.056-.692-1.653-1.123-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.009-1.252-.242-1.865-.441-.752-.244-1.349-.373-1.297-.789.027-.217.325-.44.893-.668 3.498-1.524 5.83-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.12.098.153.229.169.322.016.098.036.32.02.494z" />
    </svg>
  );
}

function FlagIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ReplyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 00-4-4H4" />
    </svg>
  );
}

/* ─── Компонент радара ─── */

function RadarAnimation({ active = true }: { active?: boolean }) {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {active && (
        <>
          <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="absolute inset-0 rounded-full border border-blue-400/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <RadarIcon className="w-24 h-24 text-blue-400/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <AnonymousAvatar className="w-10 h-10 text-blue-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Мини-карточка профиля (для шаринга) ─── */

function ProfileCard({ profile }: { profile: MockProfile }) {
  const { setViewDatingProfile } = useAnonymousChat();
  const { hasLiked } = useMatch();

  const handleGoToDating = () => {
    setViewDatingProfile(profile);
  };

  const isMatched = hasLiked(profile.id);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 max-w-[240px]">
      <div className="w-full h-32 rounded-xl overflow-hidden mb-2 bg-slate-800">
        <img src={profile.photos[0]} alt={profile.name} className="w-full h-full object-cover" />
      </div>
      <p className="text-white font-semibold text-sm">{profile.name}, {profile.age}</p>
      <p className="text-slate-400 text-xs">{profile.city}</p>
      <p className="text-slate-300 text-xs mt-1 line-clamp-2">{profile.bio}</p>
      {isMatched ? (
        <div className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-center">
          <span className="text-pink-300 text-xs font-semibold">🎉 Взаимная симпатия! Профиль доступен в дейтинге</span>
        </div>
      ) : (
        <button
          onClick={handleGoToDating}
          className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold hover:from-pink-400 hover:to-rose-400 transition-all active:scale-95"
        >
          Перейти в дейтинг
        </button>
      )}
    </div>
  );
}

/* ─── Bottom Action Sheet ─── */

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  hasProfile: boolean;
  hasSharedProfile: boolean;
  onNextPartner: () => void;
  onEndChat: () => void;
  onShareProfile: () => void;
  onShareTelegram: () => void;
  onComplain: () => void;
  isChatting: boolean;
}

function ActionSheet({ open, onClose, onNextPartner, onEndChat, onShareProfile, onShareTelegram, onComplain, isChatting }: ActionSheetProps) {
  if (!open) return null;

  const actions = [
    { icon: <span className="text-lg">🔄</span>, label: 'Следующий собеседник', onClick: onNextPartner, color: 'text-white' },
    ...(isChatting
      ? [{ icon: <span className="text-lg">🛑</span>, label: 'Остановить диалог', onClick: onEndChat, color: 'text-white' }]
      : [{ icon: <span className="text-lg">🛑</span>, label: 'Остановить поиск', onClick: onEndChat, color: 'text-white' }]),
    { icon: <span className="text-lg">🎭</span>, label: 'Поделиться анкетой', onClick: onShareProfile, color: 'text-white' },
    { icon: <TelegramIcon className="w-5 h-5" />, label: 'Поделиться Telegram', onClick: onShareTelegram, color: 'text-white' },
    { icon: <FlagIcon className="w-5 h-5" />, label: 'Пожаловаться', onClick: onComplain, color: 'text-red-400' },
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-slate-900 border-t border-white/10 rounded-t-3xl px-4 pt-5 pb-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-5" />
        <div className="space-y-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:bg-white/5 ${action.color}`}
            >
              <span className="flex-shrink-0 w-8 flex items-center justify-center">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-3 rounded-xl bg-white/5 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all active:scale-[0.98]">
          Отмена
        </button>
      </div>
    </div>
  );
}

/* ─── Превью реплая ─── */

function ReplyPreview({ replyTo, onCancel }: { replyTo: ReplyTo; onCancel: () => void }) {
  const authorName = replyTo.sender === 'self' ? 'Вы' : 'Собеседник';
  const previewText = replyTo.text || '[Фото]';
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-t border-white/5">
      <div className="w-1 h-10 rounded-full bg-gradient-to-b from-blue-400 to-violet-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-400">{authorName}</p>
        <p className="text-xs text-slate-400 truncate">{previewText}</p>
      </div>
      <button onClick={onCancel} className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Мини-цитата реплая ─── */

function ReplyQuote({ replyTo }: { replyTo: ReplyTo }) {
  const authorName = replyTo.sender === 'self' ? 'Вы' : 'Собеседник';
  const quoteText = replyTo.text || '[Фото]';
  return (
    <div className="mb-1.5 px-2 py-1 rounded-lg bg-black/20 border-l-2 border-blue-400/60">
      <p className="text-[10px] font-semibold text-blue-300/80 leading-tight">{authorName}</p>
      <p className="text-[10px] text-white/60 truncate leading-tight">{quoteText}</p>
    </div>
  );
}

/* (QuickProfileModal удалён — пользователь перенаправляется на полноценный онбординг) */

/* ─── Exit Confirm Modal (три варианта) ─── */

function ExitConfirmModal({
  open,
  onMinimize,
  onEndAndExit,
  onCancel,
}: {
  open: boolean;
  onMinimize: () => void;
  onEndAndExit: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Вы покидаете чат</h3>
        <p className="text-slate-400 text-sm text-center mb-5">
          Что вы хотите сделать с текущей сессией?
        </p>
        <div className="space-y-2.5">
          <button
            onClick={onMinimize}
            className="w-full py-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold text-sm hover:bg-violet-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="text-lg">📥</span>
            <span>Свернуть чат (Рекомендуется)</span>
          </button>
          <button
            onClick={onEndAndExit}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="text-lg">❌</span>
            <span>Завершить диалог и выйти</span>
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="text-lg">↩️</span>
            <span>Отмена</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Детальный просмотр профиля бота из анонимного чата ─── */

function DatingProfileModal({
  profile, onClose, onLike, onSuperLike, onHide, onReport,
  isMatched = false,
}: {
  profile: MockProfile;
  onClose: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onHide: () => void;
  onReport: () => void;
  isMatched?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative w-full max-w-[400px] max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70 transition" aria-label="Закрыть">
          ✕
        </button>
        <div className="aspect-[4/5] bg-slate-800 overflow-hidden rounded-t-3xl">
          <img src={profile.photos[0]} alt={profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white">{profile.name}, {profile.age}</h2>
            <span className="text-slate-400 text-sm">{profile.city}</span>
          </div>
          <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 text-xs font-medium border border-pink-500/20">
            {profile.goal}
          </div>
          {profile.bio && <p className="mt-3 text-sm text-slate-300 leading-relaxed">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-white/8 text-slate-300 text-xs border border-white/5">{i}</span>
            ))}
          </div>
        </div>
        {isMatched ? (
          <div className="px-5 pb-5">
            <div className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gradient-to-r from-pink-500/15 to-rose-500/15 border border-pink-500/25">
              <span className="text-2xl">🎉</span>
              <p className="text-pink-300 text-sm font-semibold">Взаимная симпатия!</p>
              <p className="text-pink-400/70 text-xs">Профиль доступен в дейтинге</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={onLike} className="flex-1 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-medium text-sm hover:bg-green-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                ❤️ Лайк
              </button>
              <button onClick={onSuperLike} className="flex-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 font-medium text-sm hover:bg-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                ⭐ Суперлайк
              </button>
            </div>
            <div className="px-5 pb-2 flex gap-2.5">
              <button onClick={onHide} className="flex-1 py-2.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 text-xs font-medium hover:bg-slate-700/80 transition active:scale-95">🙈 Скрыть</button>
              <button onClick={onReport} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-xs font-medium hover:bg-red-500/20 transition active:scale-95">🚩 Пожаловаться</button>
            </div>
          </>
        )}
        <div className="h-5" />
      </div>
    </div>
  );
}

/* ─── Утилита: тост-уведомление ─── */

function showToast(message: string) {
  const el = document.createElement('div');
  el.className =
    'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-sm font-medium shadow-2xl pointer-events-none';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }, 2200);
}

/* ─── Главный компонент ─── */

export function AnonymousChatScreen() {
  const { navigateTo, setRedirectSource } = useScreen();
  const { triggerMatch, hasLiked } = useMatch();
  const ctx = useAnonymousChat();

  const {
    status, setStatus,
    searchGender, setSearchGender,
    matchedProfile,
    messages,
    inputText, setInputText,
    hasSharedProfile,
    selfGender, setSelfGender,
    selfAge, setSelfAge,
    anonymousInterests, setAnonymousInterests,
    isAdultMode, setIsAdultMode,
    showInterests, setShowInterests,
    editMode, setEditMode,
    showActionSheet, setShowActionSheet,
    showTelegramInput, setShowTelegramInput,
    showNoProfileModal, setShowNoProfileModal,
    replyToMessage, setReplyToMessage,
    hasProfile, hasSavedAnonSettings, userAgeGroup, isAdult,
    startSearching, stopSearching, resumeSearching,
    sendMessage, nextPartner, endChat,
    shareProfile,
    shareTelegram, handleTelegramSave,
    complain, handleFileSelect, triggerFileInput,
    handleKeyDown, handleReplyToMessage, sendVoice,
    messagesEndRef, inputRef, fileInputRef,
    showExitConfirm, setShowExitConfirm,
    setPendingNavigation,
    viewDatingProfile, setViewDatingProfile,
  } = ctx;

  // Local states
  const [tgInputValue, setTgInputValue] = useState('');
  const [interestsExpanded, setInterestsExpanded] = useState(false);

  // Голосовые сообщения — hold-to-record
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const holdStartRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeRef = useRef<number>(0);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatVoiceDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        const duration = recordingTimeRef.current;
        if (duration >= 1) {
          sendVoice(duration, audioUrl);
          // Освобождаем Blob URL после задержки (даём аудио время на инициализацию)
          setTimeout(() => URL.revokeObjectURL(audioUrl), 60_000);
        } else {
          URL.revokeObjectURL(audioUrl);
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          recordingTimeRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        showToast('🎙️ Разрешите доступ к микрофону в настройках браузера');
      } else {
        showToast('❌ Не удалось получить доступ к микрофону');
      }
    }
  };

  const stopRecordingAndSend = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  };

  const handleHoldStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    holdStartRef.current = Date.now();
    holdTimerRef.current = setTimeout(() => startRecording(), 200);
  };

  const handleHoldEnd = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    const holdDuration = Date.now() - holdStartRef.current;
    if (holdDuration < 300 && !isRecording) {
      showToast('🎙️ Удерживайте для записи');
      return;
    }
    if (isRecording) stopRecordingAndSend();
  }, [isRecording, stopRecordingAndSend]);
  // Локальный флаг привязки анкеты (не удаляет основной профиль)
  const [isProfileLinked, setIsProfileLinked] = useState(() => {
    try {
      const raw = localStorage.getItem('dateme_anon_unlinked');
      return raw !== 'true';
    } catch { return true; }
  });

  // Вычисляем effective hasProfile: профиль существует И привязан
  const effectiveHasProfile = hasProfile && isProfileLinked;

  /* ── Функции навигации с проверкой выхода ── */

  const requestNavigation = (target: () => void) => {
    if (status === 'chatting' || status === 'searching') {
      setPendingNavigation(() => target);
      setShowExitConfirm(true);
    } else {
      target();
    }
  };

  /* ── Минимизация (свернуть чат): стейт НЕ сбрасывается, сессия жива ── */
  const minimizeChat = () => {
    setShowExitConfirm(false);
    setPendingNavigation(null);
    // Навигация на портал без сброса сессии — статус остаётся chatting/searching
    navigateTo('welcome');
  };

  /* ── Завершить и выйти: полный разрыв сессии, переход на портал ── */
  const endAndExit = () => {
    if (status === 'chatting') {
      endChat();
    } else if (status === 'searching') {
      stopSearching();
    }
    setShowExitConfirm(false);
    setPendingNavigation(null);
    navigateTo('welcome');
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    setPendingNavigation(null);
  };

  const goToSettings = () => {
    requestNavigation(() => setStatus('setup'));
  };

  /* ── Telegram save ── */
  const handleTgSaveLocal = () => {
    const trimmed = tgInputValue.trim().replace(/^@/, '');
    if (trimmed.length > 0) {
      handleTelegramSave(trimmed);
      setTgInputValue('');
    }
  };

  /* ── View dating profile actions ── */
  const handleLikeOnProfile = () => {
    if (viewDatingProfile) {
      triggerMatch(viewDatingProfile);
      setViewDatingProfile(null);
    }
  };

  const handleSuperLikeOnProfile = () => {
    if (viewDatingProfile) {
      triggerMatch(viewDatingProfile);
      setViewDatingProfile(null);
    }
  };

  /* ── Переход на онбординг из анонимки ── */
  const goToOnboarding = () => {
    setRedirectSource('anon');
    navigateTo('onboarding');
  };

  /* ── Хелперы ── */

  function getGenderLabel(gender: 'male' | 'female'): string {
    return gender === 'male' ? 'Парень' : 'Девушка';
  }

  const selfAgeNum = parseInt(selfAge, 10);
  const selfAgeValid = selfAge === '' || (!isNaN(selfAgeNum) && selfAgeNum >= 14 && selfAgeNum <= 99);
  const canStart = hasProfile || (selfAgeValid && selfAge.trim() !== '');
  const showSummary = hasSavedAnonSettings && !editMode;

  /* ── Рендер: Setup ── */

  if (status === 'setup') {
    return (
      <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col bg-premium-gradient px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            <button onClick={() => navigateTo('welcome')} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg" title="На портал">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
            <button onClick={() => navigateTo('dating')} className="text-pink-400 hover:text-pink-300 transition-colors p-1.5 rounded-lg" title="В дейтинг">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
          </div>
          <h1 className="text-xl font-bold text-white">Анонимный чат</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center overflow-y-auto">
          {/* ── Баннер интеграции с дейтингом ── */}
          {effectiveHasProfile ? (
            <div className="w-full mb-5">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-green-300 font-semibold text-sm">Интеграция с Дейтингом</p>
                  <p className="text-green-400/70 text-xs mt-0.5">Ваша дейтинг-анкета успешно привязана — шаринг доступен в чате</p>
                </div>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
              </div>
              <button
                onClick={() => {
                  // Только меняем локальный флаг — основной профиль НЕ трогаем
                  setIsProfileLinked(false);
                  try { localStorage.setItem('dateme_anon_unlinked', 'true'); } catch { /* ignore */ }
                }}
                className="mt-2 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-medium"
              >
                🔗 Отвязать анкету от анонимки
              </button>
            </div>
          ) : (
            <div className="w-full mb-5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎭</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-violet-300 font-semibold text-sm">Интеграция с Дейтингом</p>
                  <p className="text-violet-400/70 text-xs mt-0.5 mb-3">Хотите обмениваться анкетами и находить взаимные мэтчи? Привяжите или создайте профиль в дейтинге.</p>
                  <button
                    onClick={goToOnboarding}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold hover:from-violet-400 hover:to-fuchsia-400 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                  >
                    <span>🎯</span>
                    <span>Создать анкету</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 opacity-80 flex-shrink-0">
            <AnonymousAvatar className="w-20 h-20 text-blue-400" />
          </div>

          {showSummary && (
            <div className="w-full mb-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Готово к поиску</p>
                  <p className="text-slate-400 text-xs">Ваши настройки анонимного чата</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Пол:</span>
                  <span className="text-white font-medium">{selfGender === 'male' ? '🙋‍♂️ Парень' : '🙋‍♀️ Девушка'}</span>
                </div>
                {hasSavedAnonSettings && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Возраст:</span>
                    <span className="text-white font-medium">{selfAge} лет</span>
                  </div>
                )}
                {anonymousInterests.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-500 flex-shrink-0">Интересы:</span>
                    <div className="flex flex-wrap gap-1">
                      {anonymousInterests.map((i) => (
                        <span key={i} className="bg-violet-600/30 text-violet-300 text-xs rounded-full px-2 py-0.5">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
                {isAdultMode && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Режим:</span>
                    <span className="text-pink-400 font-medium">🔞 Взрослые разговоры 18+</span>
                  </div>
                )}
              </div>
              <button onClick={() => setEditMode(true)} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-all active:scale-[0.98]">
                ✏️ Редактировать настройки анонимки
              </button>
            </div>
          )}

          {!hasProfile && (!hasSavedAnonSettings || editMode) && (
            <div className="w-full space-y-4 mb-6">
              {editMode && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-300">Редактирование настроек</p>
                  <button onClick={() => setEditMode(false)} className="text-xs text-slate-500 hover:text-white transition-colors">Готово ✓</button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ваш пол</label>
                <div className="flex gap-2">
                  <button onClick={() => setSelfGender('male')} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${selfGender === 'male' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
                    🙋‍♂️ Парень
                  </button>
                  <button onClick={() => setSelfGender('female')} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${selfGender === 'female' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
                    🙋‍♀️ Девушка
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ваш возраст</label>
                <input type="number" min={14} max={99} value={selfAge} onChange={(e) => setSelfAge(e.target.value)} placeholder="От 14 до 99" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-violet-400/50 transition-all" />
                {!selfAgeValid && selfAge !== '' && <p className="text-red-400 text-xs mt-1">Введите число от 14 до 99</p>}
              </div>

              {/* ── Adult Mode Toggle ── */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">🔞 Взрослые разговоры 18+</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAdult ? 'Искать собеседников для взрослых тем и ролевых игр' : 'Доступно только с 18 лет'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isAdultMode;
                      setIsAdultMode(next);
                      if (next) {
                        setAnonymousInterests((prev) => {
                          const withAdult = prev.includes('Взрослые разговоры 18+') ? prev : [...prev, 'Взрослые разговоры 18+'];
                          return withAdult.includes('Ролевые игры') ? withAdult : [...withAdult, 'Ролевые игры'];
                        });
                      }
                    }}
                    disabled={!isAdult}
                    className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${!isAdult ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: isAdultMode && isAdult ? '#ec4899' : '#374151' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                      style={{ transform: isAdultMode && isAdult ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
                {isAdultMode && isAdult && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 text-xs border border-violet-500/20">Ролевые игры</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-600/30 text-pink-300 text-xs border border-pink-500/20">18+ Ролевые игры</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-600/30 text-pink-300 text-xs border border-pink-500/20">Взрослые разговоры 18+</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-white mb-2 text-center">Кого вы ищете?</h2>
          <p className="text-slate-400 text-sm mb-5 text-center">Выберите, с кем хотите начать анонимное общение</p>

          <div className="flex gap-3 w-full mb-6">
            <button onClick={() => setSearchGender('male')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${searchGender === 'male' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>🙋‍♂️ Парня</button>
            <button onClick={() => setSearchGender('female')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${searchGender === 'female' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>🙋‍♀️ Девушку</button>
            <button onClick={() => setSearchGender('all')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${searchGender === 'all' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>🌐 Всех</button>
          </div>

          <div className="w-full mb-6">
            <button onClick={() => setShowInterests(!showInterests)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors mb-3">
              <span>🎯</span>
              <span>{showInterests ? 'Скрыть интересы' : 'Выбрать интересы'}</span>
              {anonymousInterests.length > 0 && <span className="bg-violet-600 text-white text-xs rounded-full px-2 py-0.5">{anonymousInterests.length}</span>}
            </button>
            {showInterests && (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2">Выберите интересы — мы подберём собеседника с похожими увлечениями</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(interestsExpanded ? AVAILABLE_INTERESTS : AVAILABLE_INTERESTS.slice(0, 6)).map((interest) => {
                      const isActive = anonymousInterests.includes(interest);
                      return (
                        <button key={interest} type="button" onClick={() => {
                          if (anonymousInterests.includes(interest)) {
                            setAnonymousInterests((prev) => prev.filter((i) => i !== interest));
                          } else {
                            setAnonymousInterests((prev) => [...prev, interest]);
                          }
                        }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-violet-600 text-white border border-violet-500' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}>
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  {AVAILABLE_INTERESTS.length > 6 && (
                    <button onClick={() => setInterestsExpanded(!interestsExpanded)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      {interestsExpanded ? 'Свернуть ▲' : `Ещё ${AVAILABLE_INTERESTS.length - 6} ▼`}
                    </button>
                  )}
                  {anonymousInterests.length > 0 && <p className="text-xs text-slate-500">Выбрано: {anonymousInterests.length}</p>}
                </div>
              </div>
            )}
          </div>

          <button onClick={startSearching} disabled={!canStart} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-violet-500">
            Начать поиск
          </button>

          <p className="text-slate-500 text-xs mt-4 text-center">
            {userAgeGroup === 'teen'
              ? '🔒 Подростковый режим (14–17 лет)'
              : isAdultMode
                ? '🔞 Взрослый режим — поиск 18+'
                : '🔒 Взрослый режим (18+)'}
          </p>

          <button onClick={() => navigateTo('welcome')} className="mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← На портал
          </button>
        </div>

      </div>
    );
  }

  /* ── Рендер: Searching (Радар) ── */

  if (status === 'searching') {
    return (
      <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col bg-premium-gradient relative">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={goToSettings} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg" title="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <RadarAnimation active={true} />
          <h2 className="text-xl font-bold text-white mt-8 mb-2">Поиск собеседника...</h2>
          <p className="text-slate-400 text-sm text-center">
            {searchGender === 'male' ? 'Ищем парня для анонимного общения' : searchGender === 'female' ? 'Ищем девушку для анонимного общения' : 'Ищем случайного собеседника'}
          </p>
          <div className="flex gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        <div className="flex-shrink-0 px-3 py-3 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowActionSheet(true)} className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 select-none cursor-not-allowed">Идёт поиск собеседника...</div>
            <button disabled className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed"><SendIcon className="w-5 h-5" /></button>
          </div>
        </div>

        <ActionSheet open={showActionSheet} onClose={() => setShowActionSheet(false)} hasProfile={hasProfile} hasSharedProfile={hasSharedProfile} onNextPartner={nextPartner} onEndChat={stopSearching} onShareProfile={shareProfile} onShareTelegram={shareTelegram} onComplain={complain} isChatting={false} />
        <ExitConfirmModal open={showExitConfirm} onMinimize={minimizeChat} onEndAndExit={endAndExit} onCancel={cancelExit} />
      </div>
    );
  }

  /* ── Рендер: Stopped Search (Empty State) ── */

  if (status === 'stopped-search') {
    return (
      <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col bg-premium-gradient relative">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Красивая иллюстрация пустого состояния */}
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <RadarIcon className="w-20 h-20 text-blue-400/50" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 text-center">Анонимный чат</h2>
          <p className="text-slate-400 text-sm text-center mb-8 max-w-xs leading-relaxed">
            Найдите собеседника для анонимного общения. Мы подберём вам интересного человека!
          </p>

          <button
            onClick={resumeSearching}
            className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-lg shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>🔍</span> Найти собеседника
          </button>

          <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
            <button onClick={() => setStatus('setup')} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-[0.98] text-sm font-medium">
              ⚙️ К настройкам анонимки
            </button>
            <button onClick={() => navigateTo('welcome')} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-[0.98] text-sm font-medium">
              ← На портал
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 px-3 py-3 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowActionSheet(true)} className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 select-none cursor-not-allowed">Поиск остановлен</div>
            <button disabled className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed"><SendIcon className="w-5 h-5" /></button>
          </div>
        </div>

        <ActionSheet open={showActionSheet} onClose={() => setShowActionSheet(false)} hasProfile={hasProfile} hasSharedProfile={hasSharedProfile} onNextPartner={nextPartner} onEndChat={() => setStatus('setup')} onShareProfile={shareProfile} onShareTelegram={shareTelegram} onComplain={complain} isChatting={false} />
      </div>
    );
  }

  /* ── Рендер: Chatting / Stopped-Chat ── */

  if ((status === 'chatting' || status === 'stopped-chat') && matchedProfile) {
    const isChatActive = status === 'chatting';
    const partnerGender: 'male' | 'female' = ['Дмитрий', 'Алексей', 'Сергей', 'Максим', 'Артём'].includes(matchedProfile.name) ? 'male' : 'female';

    return (
      <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col bg-premium-gradient relative">
        {/* Шапка чата */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => requestNavigation(() => navigateTo('welcome'))} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg" title="На портал">
              ← На портал
            </button>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <AnonymousAvatar className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">Анонимный собеседник</p>
              <p className="text-slate-400 text-xs">
                {getGenderLabel(partnerGender)}, {matchedProfile.age} лет
                {!isChatActive && <span className="ml-2 text-amber-400">• Диалог завершён</span>}
              </p>
            </div>
            <button onClick={() => requestNavigation(() => navigateTo('dating'))} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold hover:from-pink-400 hover:to-rose-400 transition-all active:scale-95">
              В дейтинг →
            </button>
          </div>
        </div>

        {/* Зона сообщений */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 text-sm text-center">Напишите первое сообщение, чтобы начать анонимный диалог</p>
            </div>
          )}

          {messages.map((msg: AnonMessage) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs text-slate-500 bg-white/5 rounded-full px-3 py-1">{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'profile-card' && msg.profile) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <ProfileCard profile={msg.profile} />
                </div>
              );
            }

            if (msg.type === 'image') {
              const isSelf = msg.sender === 'self';
              return (
                <div key={msg.id} className={`group flex ${isSelf ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                  {!isSelf && isChatActive && (
                    <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                      <ReplyIcon className="w-4 h-4" />
                    </button>
                  )}
                  <div className="relative">
                    {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} />}
                    <img src={msg.content} alt="Отправленное фото" className="max-w-[200px] rounded-lg border border-slate-700 object-cover" />
                  </div>
                  {isSelf && isChatActive && (
                    <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                      <ReplyIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            }

            if (msg.type === 'voice' && msg.voiceDuration != null) {
              const isSelf = msg.sender === 'self';
              return (
                <div key={msg.id} className={`group flex ${isSelf ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                  {!isSelf && isChatActive && (
                    <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                      <ReplyIcon className="w-4 h-4" />
                    </button>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 ${isSelf ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-md' : 'bg-white/10 text-slate-200 rounded-bl-md'}`}>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <button
                        onClick={() => {
                          if (msg.audioUrl) {
                            const audio = new Audio(msg.audioUrl);
                            audio.play().catch(() => {});
                          }
                        }}
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSelf ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-300'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </button>
                      <div className="flex-1 flex items-center gap-[2px] h-6">
                        {Array.from({ length: 20 }, (_, i) => (
                          <div key={i} className="flex-1 rounded-full" style={{ height: `${8 + Math.random() * 16}px`, backgroundColor: isSelf ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }} />
                        ))}
                      </div>
                      <span className={`text-[11px] font-medium tabular-nums flex-shrink-0 ${isSelf ? 'text-white/70' : 'text-slate-500'}`}>
                        {formatVoiceDuration(msg.voiceDuration)}
                      </span>
                    </div>
                  </div>
                  {isSelf && isChatActive && (
                    <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                      <ReplyIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            }

            const isSelf = msg.sender === 'self';
            return (
              <div key={msg.id} className={`group flex ${isSelf ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                {!isSelf && isChatActive && (
                  <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                    <ReplyIcon className="w-4 h-4" />
                  </button>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isSelf ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-md' : 'bg-white/10 text-slate-200 rounded-bl-md'}`}>
                  {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} />}
                  {msg.text}
                </div>
                {isSelf && isChatActive && (
                  <button onClick={() => handleReplyToMessage(msg)} className="flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:opacity-100" title="Ответить">
                    <ReplyIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Превью реплая */}
        {replyToMessage && isChatActive && (
          <ReplyPreview replyTo={replyToMessage} onCancel={() => setReplyToMessage(null)} />
        )}

        {/* Панель ввода — Telegram-style */}
        <div className="flex-shrink-0 w-full max-w-full overflow-x-hidden px-3 py-3 border-t border-white/5 bg-white/[0.02]">
          {isChatActive ? (
            isRecording ? (
              <div className="flex items-center gap-2">
                <button onClick={cancelRecording} className="flex-shrink-0 p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all active:scale-95" title="Отменить запись">
                  <XIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-red-400 text-sm font-medium flex-shrink-0">Запись</span>
                  <span className="text-red-400/70 text-sm tabular-nums ml-auto flex-shrink-0">{formatVoiceDuration(recordingTime)}</span>
                </div>
                <button onClick={stopRecordingAndSend} className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all" title="Отправить запись">
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
            <div className="flex items-center gap-1.5">
              {/* Слева: иконка скрепки (файл) */}
              <button onClick={triggerFileInput} className="flex-shrink-0 shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-violet-400 transition-all active:scale-95">
                <ClipIcon className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

              {/* Текстовый инпут — flex-1 min-w-0 */}
              <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Напишите сообщение..." className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-violet-400/50 focus:bg-white/[0.07] transition-all" />

              {/* Динамическая кнопка: текст → отправить, пусто → микрофон */}
              {inputText.trim() ? (
                <button onClick={sendMessage} className="flex-shrink-0 shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all" title="Отправить">
                  <SendIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleHoldStart(e); }}
                  onMouseUp={(e) => { e.preventDefault(); handleHoldEnd(); }}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={(e) => { e.preventDefault(); handleHoldStart(e); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleHoldEnd(); }}
                  className="flex-shrink-0 shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-white/5 active:scale-95 transition-all select-none"
                  title="Удерживайте для записи голосового"
                >
                  🎙️
                </button>
              )}
              {/* Кнопка меню (перенесена вправо) */}
              <button onClick={() => setShowActionSheet(true)} className="flex-shrink-0 shrink-0 p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all active:scale-95" title="Меню">
                <MenuIcon className="w-4 h-4" />
              </button>
            </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-600 select-none cursor-not-allowed">Диалог завершён</div>
              <button onClick={sendMessage} disabled className="flex-shrink-0 shrink-0 p-2.5 rounded-xl bg-white/5 text-slate-600 cursor-not-allowed">
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Кнопки после завершения диалога */}
          {!isChatActive && (
            <div className="mt-3 space-y-2">
              <button onClick={nextPartner} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm hover:from-blue-400 hover:to-violet-400 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20">
                🔍 Поиск следующего собеседника
              </button>
              <div className="flex gap-2">
                <button onClick={() => navigateTo('welcome')} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-[0.98] text-sm font-medium">
                  ← На портал
                </button>
                <button onClick={() => setStatus('setup')} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-[0.98] text-sm font-medium">
                  К настройкам
                </button>
              </div>
            </div>
          )}
        </div>

        <ActionSheet open={showActionSheet} onClose={() => setShowActionSheet(false)} hasProfile={hasProfile} hasSharedProfile={hasSharedProfile} onNextPartner={nextPartner} onEndChat={endChat} onShareProfile={shareProfile} onShareTelegram={shareTelegram} onComplain={complain} isChatting={isChatActive} />
        <ExitConfirmModal open={showExitConfirm} onMinimize={minimizeChat} onEndAndExit={endAndExit} onCancel={cancelExit} />

        {/* Telegram input modal */}
        {showTelegramInput && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6" onClick={() => setShowTelegramInput(false)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <TelegramIcon className="w-7 h-7 text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Ваш Telegram</h3>
              <p className="text-slate-400 text-sm text-center mb-4">Введите ваш username, чтобы собеседник мог вас найти</p>
              <input type="text" value={tgInputValue} onChange={(e) => setTgInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleTgSaveLocal(); }} placeholder="@username" autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-400/50 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => { setShowTelegramInput(false); setTgInputValue(''); }} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-all">Отмена</button>
                <button onClick={handleTgSaveLocal} disabled={!tgInputValue.trim()} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:from-blue-400 hover:to-cyan-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">Поделиться</button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка «Нет анкеты» — перенаправление на онбординг */}
        {showNoProfileModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowNoProfileModal(false)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-1">Создайте анкету</h3>
              <p className="text-slate-400 text-xs text-center mb-5">Чтобы поделиться профилем, пройдите быстрый онбординг</p>
              <div className="flex gap-3">
                <button onClick={() => setShowNoProfileModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-all">Отмена</button>
                <button onClick={() => { setShowNoProfileModal(false); goToOnboarding(); }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:from-violet-400 hover:to-fuchsia-400 transition-all active:scale-95">Создать</button>
              </div>
            </div>
          </div>
        )}

        {/* Детальный просмотр профиля бота */}
        {viewDatingProfile && (
          <DatingProfileModal
            profile={viewDatingProfile}
            onClose={() => setViewDatingProfile(null)}
            onLike={handleLikeOnProfile}
            onSuperLike={handleSuperLikeOnProfile}
            onHide={() => setViewDatingProfile(null)}
            onReport={() => { alert('Жалоба отправлена'); setViewDatingProfile(null); }}
            isMatched={hasLiked(viewDatingProfile.id)}
          />
        )}
      </div>
    );
  }

  return null;
}
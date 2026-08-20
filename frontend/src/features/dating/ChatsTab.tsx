import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, type ChatThread, type ChatMessage } from '../../context/ChatContext';
import { useMatch } from '../../context/MatchContext';
import type { MockProfile } from '../swipes/mockProfiles';
import { ReportModal, type ReportReasonId } from './ReportModal';

/** Максимальный размер фото: 15 МБ */
const MAX_PHOTO_FILE_SIZE = 15 * 1024 * 1024;

type TabId = 'swipes' | 'catalog' | 'likes' | 'chats' | 'profile';

/* ─── Утилита: тост-уведомление ─── */

function showToast(message: string) {
  const el = document.createElement('div');
  el.className =
    'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-sm font-medium shadow-2xl animate-slide-up pointer-events-none';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }, 2200);
}

/* ─── Утилита: форматирование длительности голоса ─── */

function formatVoiceDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Лайтбокс для просмотра фото ─── */

function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-lg hover:bg-white/20 transition-colors z-10"
        aria-label="Закрыть"
      >
        ✕
      </button>
      <img
        src={url}
        alt="Просмотр фото"
        className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── Голосовое сообщение (компонент с реальным аудио) ─── */

function VoiceMessage({ duration, isSelf, audioUrl }: { duration: number; isSelf: boolean; audioUrl?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Создаём аудио-элемент при монтировании
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current && audioRef.current.duration) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      });
    }
    const intervalId = intervalRef.current;
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audioRef.current = null;
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Генерация псевдо-волны (набор высот баров) — useState lazy init допускает impure-функции
  const [bars] = useState(() => Array.from({ length: 28 }, () => 8 + Math.random() * 24));

  const playedBars = Math.floor((progress / 100) * bars.length);

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isSelf
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300'
        }`}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-[2px] h-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-75"
            style={{
              height: `${h}px`,
              backgroundColor: i < playedBars
                ? isSelf ? 'rgba(255,255,255,0.8)' : 'rgba(167,139,250,0.9)'
                : isSelf ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <span className={`flex-shrink-0 text-[11px] font-medium tabular-nums ${isSelf ? 'text-white/70' : 'text-slate-500'}`}>
        {isPlaying ? formatVoiceDuration(Math.floor((progress / 100) * duration)) : formatVoiceDuration(duration)}
      </span>
    </div>
  );
}

/* ─── Карусель мэтчей ─── */

function MatchCard({
  profile,
  onClick,
  onContextMenu,
}: {
  profile: MockProfile;
  onClick: () => void;
  onContextMenu: (profile: MockProfile, anchor: HTMLElement) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    longPressTimer.current = setTimeout(() => {
      onContextMenu(profile, e.currentTarget as HTMLElement);
      longPressTimer.current = null;
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(profile, e.currentTarget as HTMLElement);
      }}
      className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
    >
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500/60 shadow-lg shadow-pink-500/20">
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        {/* Индикатор «новый мэтч» */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-500/30 to-transparent" />
      </div>
      <span className="text-[11px] text-slate-300 font-medium truncate w-full text-center">
        {profile.name}
      </span>
    </button>
  );
}

function MatchesCarousel({ onOpenChat }: { onOpenChat: (profile: MockProfile) => void }) {
  const { threads } = useChat();
  const { unmatchProfile, blockAndReportUser } = useMatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Контекстное меню
  const [ctxMenu, setCtxMenu] = useState<{ profile: MockProfile; x: number; y: number } | null>(null);
  // Report modal
  const [reportProfile, setReportProfile] = useState<MockProfile | null>(null);

  const handleContextMenu = useCallback((profile: MockProfile, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    setCtxMenu({ profile, x: rect.left + rect.width / 2, y: rect.bottom + 4 });
  }, []);

  const handleUnmatch = useCallback(
    (profileId: string) => {
      unmatchProfile(profileId);
      setCtxMenu(null);
      showToast('Мэтч удалён');
    },
    [unmatchProfile],
  );

  const handleBlockConfirm = useCallback(
    (reason: ReportReasonId) => {
      if (!reportProfile) return;
      blockAndReportUser(reportProfile.id, reason);
      setReportProfile(null);
      showToast('Пользователь заблокирован');
    },
    [reportProfile, blockAndReportUser],
  );

  // Закрытие контекстного меню при клике вне
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [ctxMenu]);

  if (threads.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-b border-white/5">
      <div className="px-4 pt-3 pb-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Мэтчи</h3>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 px-4 pb-3 overflow-x-auto scrollbar-hide"
      >
        {threads.map((t) => (
          <MatchCard
            key={t.profile.id}
            profile={t.profile}
            onClick={() => onOpenChat(t.profile)}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Контекстное меню */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          profile={ctxMenu.profile}
          onUnmatch={handleUnmatch}
          onReport={(p) => {
            setCtxMenu(null);
            setReportProfile(p);
          }}
        />
      )}

      {/* Report modal */}
      {reportProfile && (
        <ReportModal
          profileName={reportProfile.name}
          onConfirm={handleBlockConfirm}
          onClose={() => setReportProfile(null)}
        />
      )}
    </div>
  );
}

/* ─── Контекстное меню (общее) ─── */

function ContextMenu({
  x,
  y,
  profile,
  onUnmatch,
  onReport,
}: {
  x: number;
  y: number;
  profile: MockProfile;
  onUnmatch: (id: string) => void;
  onReport: (profile: MockProfile) => void;
}) {
  // Не даём меню выйти за пределы экрана
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 120),
    zIndex: 9998,
  };

  return (
    <div
      style={style}
      className="w-52 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-1.5 animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onUnmatch(profile.id)}
        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 transition-colors flex items-center gap-2.5"
      >
        <span>💔</span> Удалить мэтч
      </button>
      <div className="mx-3 border-t border-white/5" />
      <button
        onClick={() => onReport(profile)}
        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
      >
        <span>🚩</span> Пожаловаться и заблокировать
      </button>
    </div>
  );
}

/* ─── Список диалогов ─── */

function ChatList({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
  const { threads, openChat } = useChat();

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Красивая иллюстрация пустого состояния */}
        <div className="relative w-28 h-28 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/10 to-violet-500/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500/5 to-transparent border border-pink-500/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400/60">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Пока нет взаимных симпатий</h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-6">
          Лайкайте анкеты в Ленте, чтобы найти взаимность и начать общение!
        </p>

        <button
          onClick={() => onSwitchTab('swipes')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-rose-400 transition-all active:scale-[0.97] flex items-center gap-2"
        >
          <span>💫</span> Перейти к свайпам
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Карусель мэтчей */}
      <MatchesCarousel onOpenChat={openChat} />

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Сообщения</h3>
        </div>
        {threads.map((t) => (
          <ChatListItem key={t.profile.id} thread={t} onClick={() => openChat(t.profile)} />
        ))}
      </div>
    </div>
  );
}

function ChatListItem({ thread, onClick }: { thread: ChatThread; onClick: () => void }) {
  // Вычисляем время последнего сообщения
  const lastMsg = thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
  const timeStr = lastMsg ? formatTime(lastMsg.timestamp) : '';

  // Количество непрочитанных (эмуляция — показываем 0)
  const unreadCount = 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left border-b border-slate-800/50"
    >
      <div className="relative flex-shrink-0">
        <img
          src={thread.profile.photos[0]}
          alt={thread.profile.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {/* Онлайн индикатор */}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-white font-medium text-sm truncate">
            {thread.profile.name}, {thread.profile.age}
          </p>
          {timeStr && (
            <span className="text-slate-500 text-[11px] flex-shrink-0 ml-2">{timeStr}</span>
          )}
        </div>
        <p className="text-slate-400 text-xs truncate mt-0.5">{thread.lastMessage}</p>
      </div>
      {unreadCount > 0 && (
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{unreadCount}</span>
        </div>
      )}
    </button>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Сейчас';
  if (diffMins < 60) return `${diffMins}м`;
  if (diffHours < 24) return `${diffHours}ч`;
  if (diffDays < 7) return `${diffDays}д`;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/* ─── Модалка подтверждения удаления мэтча ─── */

function UnmatchConfirmModal({
  profileName,
  onConfirm,
  onClose,
}: {
  profileName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="text-4xl mb-3">💔</div>
          <h3 className="text-lg font-bold text-white">Удалить мэтч?</h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Удалить мэтч с <span className="text-white font-medium">{profileName}</span>? Переписка исчезнет у обоих
          </p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold"
          >
            Оставить
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all text-sm font-semibold"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Шторка профиля из чата ─── */

function ChatProfileSheet({ profile, onClose }: { profile: MockProfile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[500px] max-h-[75vh] overflow-y-auto bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ручка */}
        <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 rounded-t-3xl z-10">
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{profile.name}, {profile.age}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-sm hover:bg-white/20 transition" aria-label="Закрыть">
              ✕
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-white/50 text-sm">{profile.city}</span>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-4">
          {/* Фото */}
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-800">
            <img src={profile.photos[0]} alt={profile.name} className="w-full h-full object-cover" />
          </div>

          {/* Цель */}
          <div className="inline-block px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-medium border border-pink-500/20">
            {profile.goal}
          </div>

          {/* Описание */}
          {profile.bio && (
            <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
          )}

          {/* Интересы */}
          {profile.interests.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Интересы</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span key={interest} className="px-3 py-1.5 rounded-full bg-white/8 text-slate-300 text-xs border border-white/5">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Дополнительные фото */}
          {profile.photos.length > 1 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Все фото</p>
              <div className="grid grid-cols-2 gap-2">
                {profile.photos.slice(1).map((photo, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800">
                    <img src={photo} alt={`${profile.name} фото ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Окно переписки ─── */

function ChatWindow() {
  const { getActiveThread, closeChat, sendMessage, sendPhoto, sendPhotos, sendVoice, shareTelegram } = useChat();
  const { unmatchProfile, blockAndReportUser } = useMatch();
  const thread = getActiveThread();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Состояния модалок
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  // Скрытый input для выбора фото
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояние записи голоса (hold-to-record)
  const [isRecording, setIsRecording] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const holdStartRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeRef = useRef<number>(0);

  // Закрытие dropdown при клике вне
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showDropdown) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thread?.profile.id]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      const interval = recordingIntervalRef.current;
      if (interval) clearInterval(interval);
      const stream = audioStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // stopRecordingAndSend — обёрнут в useCallback для стабильных зависимостей handleHoldEnd
  const stopRecordingAndSend = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // handleHoldEnd — хук (useCallback), должен быть до условного return
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
    if (isRecording) {
      stopRecordingAndSend();
    }
  }, [isRecording, stopRecordingAndSend]);

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Чат не найден
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Нативная загрузка фото (мульти, до 10) ─── */

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Валидация типов и размеров
    const fileList = Array.from(files)
      .filter((file) => file.type.startsWith('image/') && file.size <= MAX_PHOTO_FILE_SIZE)
      .slice(0, 10);

    if (fileList.length === 0) {
      e.target.value = '';
      return;
    }

    const urls: string[] = [];
    let loaded = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        urls.push(reader.result as string);
        loaded++;
        if (loaded === fileList.length) {
          if (urls.length === 1) {
            sendPhoto(urls[0]);
          } else {
            sendPhotos(urls);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  /* ─── Запись голоса (MediaRecorder API) ─── */

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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Если отмена — не отправляем
        if (isCancelling) {
          setIsCancelling(false);
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((t) => t.stop());
            audioStreamRef.current = null;
          }
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        const duration = recordingTimeRef.current;
        if (duration >= 1) {
          sendVoice(duration, audioUrl);
          showToast('🎙️ Голосовое отправлено');
          // Освобождаем Blob URL после небольшой задержки (даём аудио время на инициализацию)
          setTimeout(() => URL.revokeObjectURL(audioUrl), 60_000);
        } else {
          // Короткая запись — сразу освобождаем
          URL.revokeObjectURL(audioUrl);
        }

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setIsCancelling(false);
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

  const cancelRecording = () => {
    setIsCancelling(true);
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
    showToast('Запись отменена');
  };

  // Hold-to-record handlers
  const handleHoldStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    holdStartRef.current = Date.now();
    holdTimerRef.current = setTimeout(() => {
      startRecording();
    }, 200); // 200ms для определения удержания
  };

  const handleUnmatch = () => {
    setShowDropdown(false);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    unmatchProfile(thread.profile.id);
    setShowUnmatchConfirm(false);
    showToast('Мэтч удалён');
  };

  const handleReportOpen = () => {
    setShowDropdown(false);
    setShowReportModal(true);
  };

  const handleReportConfirm = (reason: ReportReasonId) => {
    blockAndReportUser(thread.profile.id, reason);
    setShowReportModal(false);
    showToast('Пользователь заблокирован');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800 bg-slate-900/80">
        <button
          onClick={closeChat}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Назад к списку чатов"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => setShowProfileSheet(true)}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          <img
            src={thread.profile.photos[0]}
            alt={thread.profile.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {thread.profile.name}, {thread.profile.age}
            </p>
          </div>
        </button>

        {/* Кнопка поделиться Telegram */}
        <button
          onClick={shareTelegram}
          className="text-sky-400 hover:text-sky-300 transition-colors p-1.5"
          aria-label="Поделиться контактом Telegram"
          title="Поделиться контактом Telegram"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.938z" />
          </svg>
        </button>

        {/* Меню «три точки» */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="text-slate-400 hover:text-white transition-colors p-1.5"
            aria-label="Меню чата"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-1.5 animate-slide-up z-50">
              <button
                onClick={handleUnmatch}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <span>💔</span> Удалить мэтч
              </button>
              <div className="mx-3 border-t border-white/5" />
              <button
                onClick={handleReportOpen}
                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
              >
                <span>🚩</span> Пожаловаться и заблокировать
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {thread.messages.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            Напишите первое сообщение, чтобы начать общение!
          </p>
        )}
        {thread.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onPhotoClick={setLightboxUrl} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Панель ввода — w-full, overflow-x-hidden */}
      <div className="flex-shrink-0 w-full max-w-full overflow-x-hidden px-2 py-2 border-t border-slate-800 bg-slate-900/80">
        {/* Индикатор записи */}
        {isRecording ? (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="flex-shrink-0 p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all active:scale-95"
              title="Отменить запись"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-red-400 text-sm font-medium flex-shrink-0">Запись</span>
              <span className="text-red-400/70 text-sm tabular-nums ml-auto flex-shrink-0">
                {formatVoiceDuration(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecordingAndSend}
              className="flex-shrink-0 shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
              title="Отправить запись"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Скрытый input для выбора фото */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoFileChange}
            />

            {/* Кнопка фотовложения — нативный выбор файла */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-pink-400 hover:bg-white/5 transition-all active:scale-95"
              title="Отправить фото"
            >
              📷
            </button>

            {/* Текстовый инпут — flex-1 min-w-0 чтобы сжимался */}
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Сообщение..."
              className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500/60 transition-colors"
            />

            {/* Динамическая кнопка: текст → отправить, пусто → микрофон */}
            {draft.trim() ? (
              <button
                onClick={handleSend}
                className="flex-shrink-0 shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                title="Отправить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
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
          </div>
        )}
      </div>

      {/* Модалка удаления мэтча */}
      {showUnmatchConfirm && (
        <UnmatchConfirmModal
          profileName={thread.profile.name}
          onConfirm={confirmUnmatch}
          onClose={() => setShowUnmatchConfirm(false)}
        />
      )}

      {/* Модалка жалобы */}
      {showReportModal && (
        <ReportModal
          profileName={thread.profile.name}
          onConfirm={handleReportConfirm}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Лайтбокс */}
      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Шторка с анкетой собеседника */}
      {showProfileSheet && (
        <ChatProfileSheet profile={thread.profile} onClose={() => setShowProfileSheet(false)} />
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  onPhotoClick,
}: {
  msg: ChatMessage;
  onPhotoClick?: (url: string) => void;
}) {
  const isSelf = msg.sender === 'self';
  const isSystem = msg.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs px-3 py-1.5 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  // Фото-сообщение (мульти-фото с сеткой)
  if (msg.type === 'photo') {
    const photos = msg.photoUrls && msg.photoUrls.length > 0
      ? msg.photoUrls
      : msg.photoUrl
        ? [msg.photoUrl]
        : [];

    if (photos.length === 0) return null;

    // Одно фото — полноразмер
    if (photos.length === 1) {
      return (
        <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
            isSelf ? 'rounded-br-md' : 'rounded-bl-md'
          }`}>
            <button
              onClick={() => onPhotoClick?.(photos[0])}
              className="block active:scale-[0.98] transition-transform"
            >
              <img
                src={photos[0]}
                alt="Фото"
                className="w-full max-w-[220px] h-auto object-cover"
                loading="lazy"
              />
            </button>
          </div>
        </div>
      );
    }

    // Несколько фото — сетка 2x2 с бейджем +N
    const displayPhotos = photos.slice(0, 4);
    const extraCount = photos.length - 4;

    return (
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[260px] rounded-2xl overflow-hidden ${
          isSelf ? 'rounded-br-md' : 'rounded-bl-md'
        }`}>
          <div className="grid grid-cols-2 gap-0.5">
            {displayPhotos.map((photo, i) => {
              const isLast = i === 3 && extraCount > 0;
              return (
                <button
                  key={i}
                  onClick={() => onPhotoClick?.(photo)}
                  className="relative aspect-square overflow-hidden active:scale-[0.98] transition-transform"
                >
                  <img
                    src={photo}
                    alt={`Фото ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">+{extraCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Голосовое сообщение
  if (msg.type === 'voice' && msg.voiceDuration != null) {
    return (
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-3 py-3 ${
            isSelf
              ? 'bg-sky-500/90 rounded-br-md'
              : 'bg-slate-700/80 rounded-bl-md'
          }`}
        >
          <VoiceMessage duration={msg.voiceDuration} isSelf={isSelf} audioUrl={msg.audioUrl} />
        </div>
      </div>
    );
  }

  // Текстовое сообщение
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isSelf
            ? 'bg-sky-500/90 text-white rounded-br-md'
            : 'bg-slate-700/80 text-slate-200 rounded-bl-md'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

/* ─── Главный компонент ─── */

export function ChatsTab({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
  const { activeThreadId } = useChat();

  if (activeThreadId) {
    return <ChatWindow />;
  }

  return <ChatList onSwitchTab={onSwitchTab} />;
}
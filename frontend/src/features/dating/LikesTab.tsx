import { useState, useMemo, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { useMatch } from '../../context/MatchContext';
import { calculateAge } from '../../shared/constants';
import { mockProfiles, type MockProfile } from '../swipes/mockProfiles';
import { PhotoLightbox } from '../../components/ui/PhotoLightbox';

/** Мок-анкета для демо суперлайка с сообщением */
export const SUPERLIKE_DEMO_PROFILE: MockProfile = {
  id: 'superlike-demo-sofia',
  name: 'София',
  age: 22,
  city: 'Москва',
  bio: 'Обожаю фотографировать закаты и готовить суши. Ищу того, с кем можно болтать часами обо всём на свете 🌸',
  photos: [
    'https://picsum.photos/seed/sofia1/400/600',
    'https://picsum.photos/seed/sofia2/400/600',
    'https://picsum.photos/seed/sofia3/400/600',
  ],
  interests: ['Фотография', 'Кулинария', 'Музыка', 'Путешествия'],
  goal: 'Серьёзные отношения',
  isAdult: true,
};

export const SUPERLIKE_DEMO_MESSAGE = 'Привет! У тебя суперские фотографии, давай познакомимся! ⭐';

type TabId = 'swipes' | 'catalog' | 'likes' | 'chats' | 'profile';

/** Нижняя шторка с подробностями профиля (для лайков) */
function LikesProfileSheet({
  profile,
  onClose,
  onMatch,
  onSkip,
  superlikeMessage,
}: {
  profile: MockProfile;
  onClose: () => void;
  onMatch: (profile: MockProfile) => void;
  onSkip: (id: string) => void;
  superlikeMessage?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
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
            {/* Записка к суперлайку */}
            {superlikeMessage && (
              <div className="px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 shadow-lg shadow-yellow-500/5">
                <p className="text-yellow-300/80 text-[11px] font-semibold mb-1 flex items-center gap-1.5">
                  <span className="text-sm">💛</span> Записка к суперлайку:
                </p>
                <p className="text-yellow-200/90 text-sm leading-relaxed italic whitespace-pre-wrap break-words">«{superlikeMessage}»</p>
              </div>
            )}

            {/* Цель */}
            <div className="inline-block px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-medium border border-pink-500/20">
              {profile.goal}
            </div>

            {/* Описание */}
            {profile.bio && (
              <div>
                <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Интересы */}
            {profile.interests.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">Интересы</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-full bg-white/8 text-slate-300 text-xs border border-white/5"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Галерея фото — кликабельные */}
            {profile.photos.length > 1 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">Все фото</p>
                <div className="grid grid-cols-2 gap-2">
                  {profile.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 active:scale-[0.97] transition-transform cursor-pointer"
                    >
                      <img src={photo} alt={`${profile.name} фото ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => { onSkip(profile.id); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-400/30 active:scale-95 transition-all text-sm font-medium flex items-center justify-center gap-1.5"
              >
                ✕ Пропустить
              </button>
              <button
                onClick={() => { onMatch(profile); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 active:scale-95 transition-all text-sm font-medium flex items-center justify-center gap-1.5"
              >
                ❤️ Принять лайк
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Лайтбокс */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={profile.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

/** Одна карточка в сетке лайков */
function LikeCard({
  profile,
  onMatch,
  onSkip,
  onOpen,
  isSuperLike,
  superlikeMessage,
}: {
  profile: MockProfile;
  onMatch: (profile: MockProfile) => void;
  onSkip: (id: string) => void;
  onOpen: (profile: MockProfile) => void;
  isSuperLike?: boolean;
  superlikeMessage?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(profile)}
      className={`bg-white/4 border rounded-2xl overflow-hidden transition-colors text-left active:scale-[0.98] cursor-pointer ${
        isSuperLike ? 'border-yellow-500/40 ring-1 ring-yellow-500/20' : 'border-white/5 hover:border-pink-500/20'
      }`}
    >
      {/* Фото */}
      <div className="aspect-[3/4] bg-slate-800 overflow-hidden relative">
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Бейдж суперлайка */}
        {isSuperLike && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-yellow-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg shadow-yellow-500/30">
            <span>⭐</span> Суперлайк
          </div>
        )}
      </div>

      {/* Инфо */}
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-white font-semibold text-sm truncate">{profile.name}</h3>
          <span className="text-slate-400 text-xs">{profile.age}</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5 truncate">{profile.city}</p>

        {/* Сообщение суперлайка */}
        {superlikeMessage && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-300/90 text-[11px] leading-snug line-clamp-2">«{superlikeMessage}»</p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onSkip(profile.id); }}
            className="flex-1 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:border-red-400/30 active:scale-95 transition-all text-xs font-medium flex items-center justify-center gap-1"
            aria-label={`Пропустить ${profile.name}`}
          >
            ✕ <span className="hidden sm:inline">Пропустить</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMatch(profile); }}
            className="flex-1 py-2 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 active:scale-95 transition-all text-xs font-medium flex items-center justify-center gap-1"
            aria-label={`Взаимный лайк с ${profile.name}`}
          >
            ❤️ <span className="hidden sm:inline">Взаимно</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function LikesTab({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
  const { form } = useRegistration();
  const { triggerMatch, matchedProfileIds, blockedUserIds } = useMatch();

  // Состояние для шторки профиля
  const [selectedProfile, setSelectedProfile] = useState<MockProfile | null>(null);

  // Вычисляем возраст текущего пользователя
  const userAge = useMemo(() => {
    if (!form.birthDate) return null;
    return calculateAge(form.birthDate);
  }, [form.birthDate]);

  // Начальный список: фильтруем по возрастному цензу, исключаем мэтчи и заблокированных, берём первые 3
  const initialProfiles = useMemo(() => {
    let filtered = mockProfiles;
    if (userAge !== null) {
      if (userAge >= 14 && userAge <= 17) {
        filtered = mockProfiles.filter((p) => p.age >= 14 && p.age <= 17);
      } else {
        filtered = mockProfiles.filter((p) => p.age >= 18);
      }
    }
    // Исключаем профили, с которыми уже есть мэтч
    filtered = filtered.filter((p) => !matchedProfileIds.has(p.id));
    // Исключаем заблокированных пользователей
    if (blockedUserIds.size > 0) {
      filtered = filtered.filter((p) => !blockedUserIds.has(p.id));
    }
    // Добавляем демо-суперлайк с сообщением первым
    const result = filtered.slice(0, 3);
    const hasSuperlikeDemo = result.some((p) => p.id === SUPERLIKE_DEMO_PROFILE.id);
    if (!hasSuperlikeDemo && !matchedProfileIds.has(SUPERLIKE_DEMO_PROFILE.id) && !blockedUserIds.has(SUPERLIKE_DEMO_PROFILE.id)) {
      result.unshift(SUPERLIKE_DEMO_PROFILE);
    }
    return result;
  }, [userAge, matchedProfileIds, blockedUserIds]);

  // Локальный стейт — позволяет удалять карточки по мере взаимодействия
  const [incomingProfiles, setIncomingProfiles] = useState<MockProfile[]>(initialProfiles);

  // Слушаем событие из Dev Tools для динамического добавления суперлайка
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ profile: MockProfile; message: string }>).detail;
      if (!detail?.profile) return;
      setIncomingProfiles((prev) => {
        if (prev.some((p) => p.id === detail.profile.id)) return prev;
        return [detail.profile, ...prev];
      });
    };
    window.addEventListener('datesphere:addSuperlikeDemo', handler);
    return () => window.removeEventListener('datesphere:addSuperlikeDemo', handler);
  }, []);

  const handleMatch = (profile: MockProfile) => {
    // 100% мэтч при взаимном лайке
    triggerMatch(profile);
    // Удаляем анкету из стейта — чтобы вкладка была чистой при возврате
    setIncomingProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setSelectedProfile(null);
  };

  const handleSkip = (id: string) => {
    // Мгновенно удаляем анкету из стейта
    setIncomingProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedProfile(null);
  };

  if (incomingProfiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Красивая иллюстрация пустого состояния */}
        <div className="relative w-28 h-28 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/10 to-rose-500/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500/5 to-transparent border border-pink-500/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400/60">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Вас пока никто не лайкнул</h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-6">
          Попробуйте обновить фото или био, чтобы привлечь больше внимания!
        </p>

        <button
          onClick={() => onSwitchTab('profile')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-rose-400 transition-all active:scale-[0.97] flex items-center gap-2"
        >
          <span>✏️</span> Редактировать профиль
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-white">Ты понравился им</h2>
        <p className="text-slate-400 text-xs mt-0.5">
          {incomingProfiles.length} {pluralizePeople(incomingProfiles.length)} проявили симпатию
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {incomingProfiles.map((profile) => (
          <LikeCard
            key={profile.id}
            profile={profile}
            onMatch={handleMatch}
            onSkip={handleSkip}
            onOpen={setSelectedProfile}
            isSuperLike={profile.id === SUPERLIKE_DEMO_PROFILE.id}
            superlikeMessage={profile.id === SUPERLIKE_DEMO_PROFILE.id ? SUPERLIKE_DEMO_MESSAGE : undefined}
          />
        ))}
      </div>

      {/* Шторка с подробностями профиля */}
      {selectedProfile && (
        <LikesProfileSheet
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onMatch={handleMatch}
          onSkip={handleSkip}
          superlikeMessage={selectedProfile.id === SUPERLIKE_DEMO_PROFILE.id ? SUPERLIKE_DEMO_MESSAGE : undefined}
        />
      )}
    </div>
  );
}

function pluralizePeople(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'человек';
  if (mod10 === 1) return 'человек';
  if (mod10 >= 2 && mod10 <= 4) return 'человека';
  return 'человек';
}
import { useState, useMemo, useCallback } from 'react';
import { useScreen } from '../../context/ScreenContext';
import { useRegistration } from '../../context/RegistrationContext';
import { useMatch } from '../../context/MatchContext';
import { calculateAge } from '../../shared/constants';
import { AVAILABLE_RELATIONSHIP_GOALS, AVAILABLE_INTERESTS } from '../../shared/constants';
import { mockProfiles, type MockProfile } from './mockProfiles';
import { PhotoLightbox } from '../../components/ui/PhotoLightbox';
import { ReportModal, type ReportReasonId } from '../dating/ReportModal';
import { SuperlikeModal } from '../dating/SuperlikeModal';

/** Компонент верхнего бара */
function Header({ onAnonymousChat, onUndo, canUndo, onFilterOpen }: { onAnonymousChat: () => void; onUndo: () => void; canUndo: boolean; onFilterOpen: () => void }) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          canUndo
            ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30'
            : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
        }`}
        aria-label="Отменить последний свайп"
        title="Отменить"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <span className="text-lg font-bold text-white tracking-wide">❤️ DateSphere</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onAnonymousChat}
          className="h-8 px-2 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-90 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30"
          aria-label="Анонимный чат"
          title="Анонимный чат"
        >
          <span className="text-sm leading-none">🎭</span>
        </button>
        <button
          onClick={onFilterOpen}
          className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95"
          aria-label="Фильтры"
          title="Фильтры"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>
    </header>
  );
}

/** Индикаторы прогресса фото (как в Instagram Stories) */
function PhotoIndicators({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{
            background: i <= current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
}

/** Карточка пользователя в стиле VK Dating — фото на весь экран с оверлеем */
function UserCard({
  profile,
  photoIndex,
  goPrev,
  goNext,
  onShowDetails,
  onLike,
  onSuperLike,
  onDislike,
}: {
  profile: MockProfile;
  photoIndex: number;
  goPrev: () => void;
  goNext: () => void;
  onShowDetails: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onDislike: () => void;
}) {
  const hasMultiple = profile.photos.length > 1;

  return (
    <div className="flex-1 min-h-0 relative select-none overflow-hidden">
      {/* Фото — занимает всё пространство карточки */}
      <div className="absolute inset-0 bg-slate-800">
        <img
          src={profile.photos[photoIndex]}
          alt={`${profile.name}, ${profile.age}`}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <PhotoIndicators total={profile.photos.length} current={photoIndex} />

        {/* Невидимые зоны переключения фото */}
        {hasMultiple && (
          <>
            <button
              className="absolute left-0 top-0 w-1/3 h-[calc(100%-180px)] cursor-pointer z-[5]"
              onClick={goPrev}
              aria-label="Предыдущее фото"
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-[calc(100%-180px)] cursor-pointer z-[5]"
              onClick={goNext}
              aria-label="Следующее фото"
            />
          </>
        )}

        {/* Градиент снизу для читаемости текста */}
        <div className="absolute bottom-0 left-0 right-0 h-[260px] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-[6]" />

        {/* Кликабельная зона подробностей (имя + город + фото) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[7] cursor-pointer pb-[100px] px-5"
          onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
        >
          {/* Имя и возраст */}
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              {profile.name}, {profile.age}
            </h2>
            <span className="text-amber-300 text-lg" title="Верифицирован">✨</span>
          </div>

          {/* Город и цель */}
          <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{profile.city}</span>
            <span className="text-white/30">•</span>
            <span className="text-pink-300">🎯 {profile.goal}</span>
          </div>
        </div>

        {/* ─── Плавающие экшен-кнопки поверх фото ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-[8] px-5 pb-5">
          <div className="flex items-center justify-center gap-4">
            {/* Пропустить */}
            <button
              onClick={(e) => { e.stopPropagation(); onDislike(); }}
              className="w-16 h-16 rounded-full bg-slate-800/80 backdrop-blur-md border-2 border-slate-500/40 text-slate-300 hover:border-red-400/60 hover:text-red-400 hover:bg-red-500/15 active:scale-90 transition-all duration-200 flex items-center justify-center text-2xl shadow-xl"
              aria-label="Пропустить"
            >
              ✕
            </button>

            {/* Суперлайк */}
            <button
              onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
              className="w-14 h-14 rounded-full bg-blue-600/80 backdrop-blur-md border-2 border-blue-400/40 text-white hover:border-blue-300 hover:bg-blue-500/90 active:scale-90 transition-all duration-200 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20"
              aria-label="Суперлайк"
            >
              ⭐
            </button>

            {/* Лайк */}
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="w-16 h-16 rounded-full bg-pink-500/80 backdrop-blur-md border-2 border-pink-300/40 text-white hover:border-pink-300 hover:bg-pink-500/95 active:scale-90 transition-all duration-200 flex items-center justify-center text-2xl shadow-xl shadow-pink-500/20"
              aria-label="Лайк"
            >
              ❤️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Нижняя шторка с подробностями профиля (для свайпов) */
function ProfileDetailsSheet({
  profile,
  onClose,
  onReport,
  onLike,
  onSuperLike,
  onDislike,
}: {
  profile: MockProfile;
  onClose: () => void;
  onReport: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onDislike: () => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative w-full max-h-[75vh] overflow-y-auto bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl animate-slide-up"
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

            {/* Дополнительные фото — кликабельные */}
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

            {/* Кнопка жалобы */}
            <button
              onClick={onReport}
              className="w-full py-3 rounded-xl bg-white/5 border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 active:scale-[0.97] transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              🚩 Пожаловаться и заблокировать
            </button>
          </div>

          {/* Плавающий экшен-бар */}
          <div className="sticky bottom-0 px-4 py-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {/* Пропустить */}
              <button
                onClick={(e) => { e.stopPropagation(); onDislike(); }}
                className="w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-md border-2 border-slate-500/40 text-slate-300 hover:border-red-400/60 hover:text-red-400 hover:bg-red-500/15 active:scale-90 transition-all duration-200 flex items-center justify-center text-xl shadow-xl"
                aria-label="Пропустить"
              >
                ✕
              </button>

              {/* Суперлайк */}
              <button
                onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
                className="w-14 h-14 rounded-full bg-blue-600/80 backdrop-blur-md border-2 border-blue-400/40 text-white hover:border-blue-300 hover:bg-blue-500/90 active:scale-90 transition-all duration-200 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20"
                aria-label="Суперлайк"
              >
                ⭐
              </button>

              {/* Лайк */}
              <button
                onClick={(e) => { e.stopPropagation(); onLike(); }}
                className="w-14 h-14 rounded-full bg-pink-500/80 backdrop-blur-md border-2 border-pink-300/40 text-white hover:border-pink-300 hover:bg-pink-500/95 active:scale-90 transition-all duration-200 flex items-center justify-center text-xl shadow-xl shadow-pink-500/20"
                aria-label="Лайк"
              >
                ❤️
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

/** Модалка фильтров для свайпов */
function SwipesFilterSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[500px] max-h-[85vh] bg-slate-900 border border-white/10 rounded-t-3xl shadow-2xl animate-slide-up flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <h3 className="text-lg font-bold text-white mb-5 text-center">Фильтры</h3>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Возраст</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">От</label>
                <input type="number" min={14} max={99} defaultValue={18} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-pink-500/60 transition-colors" />
              </div>
              <span className="text-slate-500 mt-5">—</span>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">До</label>
                <input type="number" min={14} max={99} defaultValue={99} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-pink-500/60 transition-colors" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Цели знакомства</h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_RELATIONSHIP_GOALS.map((goal) => (
                <button key={goal} type="button" className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300">
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Интересы</h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.slice(0, 12).map((interest) => (
                <button key={interest} type="button" className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300">
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold">
            Сбросить
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-pink-500 text-white hover:bg-pink-600 active:scale-95 transition-all text-sm font-semibold">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

/** Экран «Анкеты закончились» */
function NoMoreProfiles() {
  const { navigateTo } = useScreen();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl mb-4">💔</div>
      <h2 className="text-xl font-bold text-white mb-2">Анкеты закончились</h2>
      <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
        Анкеты в вашем регионе закончились. Попробуйте изменить фильтры или загляните позже.
      </p>
      <button
        onClick={() => navigateTo('welcome')}
        className="px-6 py-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 active:scale-95 transition-all text-sm font-medium"
      >
        Вернуться на главный экран
      </button>
    </div>
  );
}

/** Главный экран свайпов */
export function SwipesScreen() {
  const { navigateTo } = useScreen();
  const { form } = useRegistration();
  const { triggerMatch, matchedProfileIds, blockedUserIds, blockAndReportUser } = useMatch();
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  const [showAnonConfirm, setShowAnonConfirm] = useState(false);

  // Вычисляем возраст текущего пользователя
  const userAge = useMemo(() => {
    if (!form.birthDate) return null;
    return calculateAge(form.birthDate);
  }, [form.birthDate]);

  // Фильтруем анкеты по возрастному цензу, исключаем мэтчи и заблокированных
  const filteredProfiles = useMemo(() => {
    let result = mockProfiles;
    if (userAge !== null) {
      if (userAge >= 14 && userAge <= 17) {
        result = result.filter((p) => p.age >= 14 && p.age <= 17);
      } else {
        result = result.filter((p) => p.age >= 18);
      }
    }
    // Исключаем профили, с которыми уже есть мэтч
    if (matchedProfileIds.size > 0) {
      result = result.filter((p) => !matchedProfileIds.has(p.id));
    }
    // Исключаем заблокированных пользователей
    if (blockedUserIds.size > 0) {
      result = result.filter((p) => !blockedUserIds.has(p.id));
    }
    return result;
  }, [userAge, matchedProfileIds, blockedUserIds]);

  const currentProfile: MockProfile | undefined = filteredProfiles[index];
  const isFinished = index >= filteredProfiles.length;

  const advance = useCallback(() => {
    setPhotoIndex(0);
    setIndex((prev) => prev + 1);
  }, []);

  const handleUndo = useCallback(() => {
    setPhotoIndex(0);
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  /** 30% шанс мэтча при лайке/суперлайке */
  const maybeTriggerMatch = useCallback(
    (profile: MockProfile) => {
      const roll = Math.random();
      if (roll < 0.3) {
        triggerMatch(profile);
      }
    },
    [triggerMatch],
  );

  const handleLike = useCallback(() => {
    if (!currentProfile) return;
    maybeTriggerMatch(currentProfile);
    advance();
  }, [currentProfile, maybeTriggerMatch, advance]);

  const handleSuperLike = useCallback(() => {
    if (!currentProfile) return;
    setShowSuperlikeModal(true);
  }, [currentProfile]);

  const handleSuperLikeSend = useCallback(
    (_message: string) => {
      if (!currentProfile) return;
      setShowSuperlikeModal(false);
      maybeTriggerMatch(currentProfile);
      advance();
    },
    [currentProfile, maybeTriggerMatch, advance],
  );

  const handleDislike = useCallback(() => {
    advance();
  }, [advance]);

  const goPrevPhoto = () => {
    if (!currentProfile) return;
    setPhotoIndex((prev) =>
      prev <= 0 ? currentProfile.photos.length - 1 : prev - 1,
    );
  };

  const goNextPhoto = () => {
    if (!currentProfile) return;
    setPhotoIndex((prev) =>
      prev >= currentProfile.photos.length - 1 ? 0 : prev + 1,
    );
  };

  const handleReportConfirm = useCallback(
    (reason: ReportReasonId) => {
      if (!currentProfile) return;
      blockAndReportUser(currentProfile.id, reason);
      setShowReport(false);
      setShowDetails(false);
      advance();
    },
    [currentProfile, blockAndReportUser, advance],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <Header
        onAnonymousChat={() => setShowAnonConfirm(true)}
        onUndo={handleUndo}
        canUndo={index > 0}
        onFilterOpen={() => setShowFilter(true)}
      />

      {isFinished ? (
        <NoMoreProfiles />
      ) : (
        <UserCard
          profile={currentProfile}
          photoIndex={photoIndex}
          goPrev={goPrevPhoto}
          goNext={goNextPhoto}
          onShowDetails={() => setShowDetails(true)}
          onLike={handleLike}
          onSuperLike={handleSuperLike}
          onDislike={handleDislike}
        />
      )}

      {/* Шторка с подробностями профиля */}
      {showDetails && currentProfile && (
        <ProfileDetailsSheet
          profile={currentProfile}
          onClose={() => setShowDetails(false)}
          onReport={() => setShowReport(true)}
          onLike={() => { setShowDetails(false); handleLike(); }}
          onSuperLike={() => { setShowDetails(false); handleSuperLike(); }}
          onDislike={() => { setShowDetails(false); handleDislike(); }}
        />
      )}

      {/* Модалка жалобы */}
      {showReport && currentProfile && (
        <ReportModal
          profileName={currentProfile.name}
          onConfirm={handleReportConfirm}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Модалка фильтров */}
      {showFilter && (
        <SwipesFilterSheet onClose={() => setShowFilter(false)} />
      )}

      {/* Суперлайк модалка */}
      {showSuperlikeModal && currentProfile && (
        <SuperlikeModal
          profileName={currentProfile.name}
          onSend={handleSuperLikeSend}
          onCancel={() => setShowSuperlikeModal(false)}
        />
      )}

      {/* Подтверждение перехода в анонимный чат */}
      {showAnonConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setShowAnonConfirm(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-4xl">🎭</span>
              <h3 className="text-lg font-bold text-white mt-2">Перейти в Анонимный чат?</h3>
              <p className="text-slate-400 text-sm mt-1">Вы будете перенаправлены в анонимный чат</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAnonConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-all">
                Отмена
              </button>
              <button onClick={() => { setShowAnonConfirm(false); navigateTo('anonymous-chat'); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold text-sm hover:from-purple-400 hover:to-violet-400 transition-all active:scale-95">
                Перейти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
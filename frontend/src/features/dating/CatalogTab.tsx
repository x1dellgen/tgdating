import { useState, useMemo, useCallback, useEffect } from 'react';
import { useScreen } from '../../context/ScreenContext';
import { useRegistration } from '../../context/RegistrationContext';
import { useMatch } from '../../context/MatchContext';
import { calculateAge } from '../../shared/constants';
import { mockProfiles, type MockProfile } from '../swipes/mockProfiles';
import { AVAILABLE_RELATIONSHIP_GOALS, AVAILABLE_INTERESTS } from '../../shared/constants';
import { SuperlikeModal } from './SuperlikeModal';

// ─── Search Bar (with filter button) ────────────────────────────────────────────

function CatalogHeader({
  onFilterOpen,
  hasActiveFilters,
  onAnonymousChat,
}: {
  onFilterOpen: () => void;
  hasActiveFilters: boolean;
  onAnonymousChat: () => void;
}) {
  return (
    <div className="px-4 pt-3 pb-2 flex items-center gap-2">
      {/* Anonymous Chat button */}
      <button
        onClick={onAnonymousChat}
        className="flex-shrink-0 h-10 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-90 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30"
        aria-label="Анонимный чат"
        title="Анонимный чат"
      >
        <span className="text-base leading-none">🎭</span>
        <span className="text-xs font-medium hidden sm:inline">Анонимно</span>
      </button>

      <div className="flex-1" />

      {/* Filter button */}
      <button
        onClick={onFilterOpen}
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
          hasActiveFilters
            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
            : 'bg-white/6 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300'
        }`}
        aria-label="Фильтры"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
    </div>
  );
}

// ─── Filter Bottom Sheet ───────────────────────────────────────────────────────

// Unique cities from mockProfiles
const AVAILABLE_CITIES = [...new Set(mockProfiles.map((p) => p.city))].sort();

function FilterBottomSheet({
  isOpen,
  onClose,
  selectedGoals,
  toggleGoal,
  selectedInterests,
  toggleInterest,
  ageMin,
  ageMax,
  onAgeMinChange,
  onAgeMaxChange,
  city,
  onCityChange,
  onApply,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedGoals: string[];
  toggleGoal: (goal: string) => void;
  selectedInterests: string[];
  toggleInterest: (interest: string) => void;
  ageMin: number;
  ageMax: number;
  onAgeMinChange: (v: number) => void;
  onAgeMaxChange: (v: number) => void;
  city: string;
  onCityChange: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  // Строковое локальное состояние для полей ввода возраста
  const [localMin, setLocalMin] = useState(String(ageMin));
  const [localMax, setLocalMax] = useState(String(ageMax));

  // Синхронизируем при открытии шторки
  useEffect(() => {
    if (isOpen) {
      setLocalMin(String(ageMin));
      setLocalMax(String(ageMax));
    }
  }, [isOpen, ageMin, ageMax]);

  const handleMinBlur = () => {
    const num = parseInt(localMin, 10);
    const clamped = isNaN(num) ? 18 : Math.max(14, Math.min(ageMax, num));
    setLocalMin(String(clamped));
    onAgeMinChange(clamped);
  };

  const handleMaxBlur = () => {
    const num = parseInt(localMax, 10);
    const clamped = isNaN(num) ? 99 : Math.max(ageMin, Math.min(99, num));
    setLocalMax(String(clamped));
    onAgeMaxChange(clamped);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[500px] max-h-[85vh] bg-slate-900 border border-white/10 rounded-t-3xl shadow-2xl animate-slide-up flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <h3 className="text-lg font-bold text-white mb-5 text-center">Фильтры</h3>

          {/* Age Range */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Возраст</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">От</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onBlur={handleMinBlur}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-pink-500/60 transition-colors"
                />
              </div>
              <span className="text-slate-500 mt-5">—</span>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">До</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onBlur={handleMaxBlur}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-pink-500/60 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* City */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Город</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCityChange('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
                  city === ''
                    ? 'bg-sky-600/20 border-sky-500/50 text-sky-300'
                    : 'bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300'
                }`}
              >
                Все города
              </button>
              {AVAILABLE_CITIES.map((c) => {
                const isActive = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCityChange(isActive ? '' : c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-sky-600/20 border-sky-500/50 text-sky-300'
                        : 'bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goals */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Цели знакомства</h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_RELATIONSHIP_GOALS.map((goal) => {
                const isActive = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                        : 'bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300'
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Интересы</h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isActive = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-white/5 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-sm font-semibold"
          >
            Сбросить
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-3 rounded-xl bg-pink-500 text-white hover:bg-pink-600 active:scale-95 transition-all text-sm font-semibold"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Card (grid item) ─────────────────────────────────────────────────

function ProfileCard({
  profile,
  onOpen,
  onLike,
  onSuperLike,
  onHide,
}: {
  profile: MockProfile;
  onOpen: (p: MockProfile) => void;
  onLike: (p: MockProfile) => void;
  onSuperLike: (p: MockProfile) => void;
  onHide: (p: MockProfile) => void;
}) {
  const handleAction = (e: React.MouseEvent, action: (p: MockProfile) => void) => {
    e.stopPropagation();
    action(profile);
  };

  return (
    <button
      onClick={() => onOpen(profile)}
      className="relative flex flex-col rounded-2xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/10 hover:bg-white/8 transition-all active:scale-[0.98] text-left"
    >
      {/* Photo */}
      <div className="aspect-[3/4] bg-slate-800 overflow-hidden relative">
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />

        {/* Quick Action Buttons — круглые плашки в правом нижнем углу фото */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          <span
            role="button"
            aria-label="Скрыть"
            onClick={(e) => handleAction(e, onHide)}
            className="w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10 text-slate-300 text-sm flex items-center justify-center hover:bg-slate-800/70 hover:text-white active:scale-90 transition-all"
          >
            🙈
          </span>
          <span
            role="button"
            aria-label="Суперлайк"
            onClick={(e) => handleAction(e, onSuperLike)}
            className="w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10 text-yellow-400 text-sm flex items-center justify-center hover:bg-slate-800/70 hover:text-yellow-300 active:scale-90 transition-all"
          >
            ⭐
          </span>
          <span
            role="button"
            aria-label="Лайк"
            onClick={(e) => handleAction(e, onLike)}
            className="w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10 text-pink-400 text-sm flex items-center justify-center hover:bg-slate-800/70 hover:text-pink-300 active:scale-90 transition-all"
          >
            ❤️
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
          <span className="text-xs text-slate-400">{profile.age}</span>
        </div>
        <div className="text-[11px] text-slate-500 truncate mt-0.5">{profile.city}</div>
        <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300/80 text-[10px] font-medium border border-pink-500/15 truncate max-w-full">
          {profile.goal}
        </div>
      </div>
    </button>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ProfileModal({
  profile,
  onClose,
  onLike,
  onSuperLike,
  onHide,
  onReport,
}: {
  profile: MockProfile;
  onClose: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onHide: () => void;
  onReport: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70 transition"
          aria-label="Закрыть"
        >
          ✕
        </button>

        {/* Photo */}
        <div className="aspect-[4/5] bg-slate-800 overflow-hidden rounded-t-3xl">
          <img
            src={profile.photos[0]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white">{profile.name}, {profile.age}</h2>
            <span className="text-slate-400 text-sm">{profile.city}</span>
          </div>
          <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 text-xs font-medium border border-pink-500/20">
            {profile.goal}
          </div>
          {profile.bio && (
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-white/8 text-slate-300 text-xs border border-white/5"
              >
                {i}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onLike}
            className="flex-1 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-medium text-sm hover:bg-green-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            ❤️ Лайк
          </button>
          <button
            onClick={onSuperLike}
            className="flex-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 font-medium text-sm hover:bg-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            ⭐ Суперлайк
          </button>
        </div>
        <div className="px-5 pb-2 flex gap-2.5">
          <button
            onClick={onHide}
            className="flex-1 py-2.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-400 text-xs font-medium hover:bg-slate-700/80 transition active:scale-95"
          >
            🙈 Скрыть
          </button>
          <button
            onClick={onReport}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-xs font-medium hover:bg-red-500/20 transition active:scale-95"
          >
            🚩 Пожаловаться
          </button>
        </div>

        {/* Safe bottom spacing */}
        <div className="h-5" />
      </div>
    </div>
  );
}

// ─── No Results ───────────────────────────────────────────────────────────────

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center py-16">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-lg font-bold text-white mb-1">Ничего не найдено</h2>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-4">
        Попробуйте изменить фильтры или поисковый запрос
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:bg-white/12 active:scale-95 transition-all text-sm"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}

// ─── Main CatalogTab Component ────────────────────────────────────────────────

export function CatalogTab() {
  const { navigateTo } = useScreen();
  const { form } = useRegistration();
  const { triggerMatch, matchedProfileIds, blockedUserIds } = useMatch();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Age range & city filter state
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);
  const [selectedCity, setSelectedCity] = useState('');
  const [pendingAgeMin, setPendingAgeMin] = useState(18);
  const [pendingAgeMax, setPendingAgeMax] = useState(99);
  const [pendingCity, setPendingCity] = useState('');

  // Filter bottom sheet state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAnonConfirm, setShowAnonConfirm] = useState(false);

  // Pending filter changes (applied only on "Применить")
  const [pendingGoals, setPendingGoals] = useState<string[]>([...selectedGoals]);
  const [pendingInterests, setPendingInterests] = useState<string[]>([...selectedInterests]);

  // Modal state
  const [modalProfile, setModalProfile] = useState<MockProfile | null>(null);

  // Superlike modal state
  const [superlikeProfile, setSuperlikeProfile] = useState<MockProfile | null>(null);

  // User age for hard age gate
  const userAge = useMemo(() => {
    if (!form.birthDate) return null;
    return calculateAge(form.birthDate);
  }, [form.birthDate]);

  // Composite filter
  const filteredProfiles = useMemo(() => {
    // 1. Age gate
    let result = mockProfiles;
    if (userAge !== null) {
      if (userAge >= 14 && userAge <= 17) {
        result = result.filter((p) => p.age >= 14 && p.age <= 17);
      } else {
        result = result.filter((p) => p.age >= 18);
      }
    }

    // 2. Exclude matched profiles
    if (matchedProfileIds.size > 0) {
      result = result.filter((p) => !matchedProfileIds.has(p.id));
    }

    // 3. Text search (name or city, case-insensitive)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q),
      );
    }

    // 4. Goals filter (any match)
    if (selectedGoals.length > 0) {
      result = result.filter((p) => selectedGoals.includes(p.goal));
    }

    // 5. Interests filter (any match)
    if (selectedInterests.length > 0) {
      result = result.filter((p) =>
        p.interests.some((interest) => selectedInterests.includes(interest)),
      );
    }

    // 6. Age range filter
    result = result.filter((p) => p.age >= ageMin && p.age <= ageMax);

    // 7. City filter
    if (selectedCity.trim()) {
      const cityQ = selectedCity.trim().toLowerCase();
      result = result.filter((p) => p.city.toLowerCase() === cityQ);
    }

    // 8. Exclude hidden profiles
    if (hiddenIds.size > 0) {
      result = result.filter((p) => !hiddenIds.has(p.id));
    }

    // 9. Exclude blocked profiles
    if (blockedUserIds.size > 0) {
      result = result.filter((p) => !blockedUserIds.has(p.id));
    }

    return result;
  }, [userAge, search, selectedGoals, selectedInterests, hiddenIds, matchedProfileIds, blockedUserIds, ageMin, ageMax, selectedCity]);

  // Toggle handlers (for the bottom sheet — mutate pending state)
  const togglePendingGoal = useCallback((goal: string) => {
    setPendingGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  }, []);

  const togglePendingInterest = useCallback((interest: string) => {
    setPendingInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }, []);

  // Open filter — copy current state to pending
  const openFilter = useCallback(() => {
    setPendingGoals([...selectedGoals]);
    setPendingInterests([...selectedInterests]);
    setPendingAgeMin(ageMin);
    setPendingAgeMax(ageMax);
    setPendingCity(selectedCity);
    setIsFilterOpen(true);
  }, [selectedGoals, selectedInterests, ageMin, ageMax, selectedCity]);

  // Apply — commit pending to active
  const applyFilters = useCallback(() => {
    setSelectedGoals([...pendingGoals]);
    setSelectedInterests([...pendingInterests]);
    setAgeMin(pendingAgeMin);
    setAgeMax(pendingAgeMax);
    setSelectedCity(pendingCity);
    setIsFilterOpen(false);
  }, [pendingGoals, pendingInterests, pendingAgeMin, pendingAgeMax, pendingCity]);

  // Reset all in the sheet
  const resetFilters = useCallback(() => {
    setPendingGoals([]);
    setPendingInterests([]);
    setPendingAgeMin(18);
    setPendingAgeMax(99);
    setPendingCity('');
  }, []);

  // Reset active filters
  const resetActiveFilters = useCallback(() => {
    setSearch('');
    setSelectedGoals([]);
    setSelectedInterests([]);
    setAgeMin(18);
    setAgeMax(99);
    setSelectedCity('');
  }, []);

  // Actions
  const handleLike = useCallback(
    (profile: MockProfile) => {
      if (Math.random() < 0.3) {
        triggerMatch(profile);
      }
      setModalProfile(null);
    },
    [triggerMatch],
  );

  const handleSuperLike = useCallback(
    (profile: MockProfile) => {
      // Открываем модалку суперлайка вместо мгновенной отправки
      setModalProfile(null);
      setSuperlikeProfile(profile);
    },
    [],
  );

  const handleSuperLikeSend = useCallback(
    (_message: string) => {
      if (!superlikeProfile) return;
      if (Math.random() < 0.3) {
        triggerMatch(superlikeProfile);
      }
      setSuperlikeProfile(null);
      // Показываем тост
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-sm font-medium shadow-2xl pointer-events-none';
      toast.textContent = '⭐ Суперлайк с сообщением отправлен!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 350);
      }, 2200);
    },
    [superlikeProfile, triggerMatch],
  );

  const handleHide = useCallback((profile: MockProfile) => {
    setHiddenIds((prev) => new Set(prev).add(profile.id));
    setModalProfile(null);
  }, []);

  const handleReport = useCallback((profile: MockProfile) => {
    alert('Жалоба отправлена');
    setHiddenIds((prev) => new Set(prev).add(profile.id));
    setModalProfile(null);
  }, []);

  const hasActiveFilters = search.length > 0 || selectedGoals.length > 0 || selectedInterests.length > 0 || ageMin !== 18 || ageMax !== 99 || selectedCity !== '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header — fixed */}
      <div className="flex-shrink-0">
        <CatalogHeader
          onFilterOpen={openFilter}
          hasActiveFilters={hasActiveFilters}
          onAnonymousChat={() => setShowAnonConfirm(true)}
        />

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="px-4 pb-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Найдено: {filteredProfiles.length}
            </span>
            <button
              onClick={resetActiveFilters}
              className="text-xs text-pink-400 hover:text-pink-300 transition"
            >
              Сбросить
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-white/5" />
      </div>

      {/* Content — scrollable grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-24">
        {filteredProfiles.length === 0 ? (
          <NoResults onReset={resetActiveFilters} />
        ) : (
          <div className="grid grid-cols-2 gap-3 py-3">
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onOpen={setModalProfile}
                onLike={handleLike}
                onSuperLike={handleSuperLike}
                onHide={handleHide}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalProfile && (
        <ProfileModal
          profile={modalProfile}
          onClose={() => setModalProfile(null)}
          onLike={() => handleLike(modalProfile)}
          onSuperLike={() => handleSuperLike(modalProfile)}
          onHide={() => handleHide(modalProfile)}
          onReport={() => handleReport(modalProfile)}
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

      {/* Superlike Modal */}
      {superlikeProfile && (
        <SuperlikeModal
          profileName={superlikeProfile.name}
          onSend={handleSuperLikeSend}
          onCancel={() => setSuperlikeProfile(null)}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedGoals={pendingGoals}
        toggleGoal={togglePendingGoal}
        selectedInterests={pendingInterests}
        toggleInterest={togglePendingInterest}
        ageMin={pendingAgeMin}
        ageMax={pendingAgeMax}
        onAgeMinChange={setPendingAgeMin}
        onAgeMaxChange={setPendingAgeMax}
        city={pendingCity}
        onCityChange={setPendingCity}
        onApply={applyFilters}
        onReset={resetFilters}
      />
    </div>
  );
}
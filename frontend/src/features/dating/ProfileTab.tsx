import { useState, useRef, useCallback, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { useScreen } from '../../context/ScreenContext';
import { calculateAge, AVAILABLE_INTERESTS, AVAILABLE_RELATIONSHIP_GOALS, type RegistrationForm } from '../../shared/constants';
import { AdminPanelModal } from './AdminPanelModal';
import { PhotoLightbox } from '../../components/ui/PhotoLightbox';

const BIO_MAX_LENGTH = 200;

/** Парсит YYYY-MM-DD в [day, month, year] или ['', '', ''] */
function parseBirthDate(birthDate: string | null): [string, string, string] {
  if (!birthDate) return ['', '', ''];
  const parts = birthDate.split('-');
  if (parts.length !== 3) return ['', '', ''];
  return [parts[2] ?? '', parts[1] ?? '', parts[0] ?? ''];
}

/** Проверяет, является ли дата полностью валидной. Возвращает строку YYYY-MM-DD или null */
function validateAndBuild(day: string, month: string, year: string): string | null {
  if (day.length < 2 || month.length < 2 || year.length < 4) return null;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  if (y < 1900 || y > new Date().getFullYear()) return null;
  const dd = day.padStart(2, '0');
  const mm = month.padStart(2, '0');
  const yyyy = year.padStart(4, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function pluralizeAge(age: number): string {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'лет';
  if (mod10 === 1) return 'год';
  if (mod10 >= 2 && mod10 <= 4) return 'года';
  return 'лет';
}

/* ─── Индикаторы фото ─── */
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

/* ─── Превью карточка профиля (как в ленте свайпов) ─── */
function ProfilePreview() {
  const { form } = useRegistration();
  const [photoIndex, setPhotoIndex] = useState(0);
  const viewAge = form.birthDate ? calculateAge(form.birthDate) : null;
  const hasPhotos = form.photos.length > 0;

  const goPrev = () => {
    if (!hasPhotos) return;
    setPhotoIndex((prev) => (prev <= 0 ? form.photos.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!hasPhotos) return;
    setPhotoIndex((prev) => (prev >= form.photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mx-4 mt-3 rounded-3xl overflow-hidden bg-white/3 border border-white/5 shadow-xl">
      {/* Фото */}
      <div className="relative aspect-[4/5] bg-slate-800 overflow-hidden select-none">
        {hasPhotos ? (
          <>
            <img
              src={form.photos[photoIndex]}
              alt={form.name}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
            <PhotoIndicators total={form.photos.length} current={photoIndex} />
            {form.photos.length > 1 && (
              <>
                <button className="absolute left-0 top-0 w-1/2 h-full cursor-pointer" onClick={goPrev} aria-label="Предыдущее фото" />
                <button className="absolute right-0 top-0 w-1/2 h-full cursor-pointer" onClick={goNext} aria-label="Следующее фото" />
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <span className="text-5xl mb-3">📷</span>
            <p className="text-sm">Нет фото</p>
          </div>
        )}

        {/* Бейдж «Это вы» */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium border border-white/10">
          Это вы ✨
        </div>
      </div>

      {/* Инфо */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-white">
            {form.name || 'Без имени'}{viewAge !== null ? `, ${viewAge}` : ''}
          </h2>
          {form.city && <span className="text-slate-400 text-sm">{form.city}</span>}
        </div>
        {form.relationshipGoals.length > 0 && (
          <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 text-xs font-medium border border-pink-500/20">
            {form.relationshipGoals[0]}
          </div>
        )}
        {form.bio && (
          <p className="mt-2 text-sm text-slate-300 leading-relaxed line-clamp-3">{form.bio}</p>
        )}
        {form.interests.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {form.interests.map((interest) => (
              <span
                key={interest}
                className="flex-shrink-0 px-3 py-1 rounded-full bg-white/8 text-slate-300 text-xs border border-white/5 whitespace-nowrap"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Форма редактирования ─── */

function EditForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  onReset,
}: {
  draft: RegistrationForm;
  setDraft: React.Dispatch<React.SetStateAction<RegistrationForm>>;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const [localDay, setLocalDay] = useState('');
  const [localMonth, setLocalMonth] = useState('');
  const [localYear, setLocalYear] = useState('');
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const computedAge = draft.birthDate ? calculateAge(draft.birthDate) : null;
  const ageValid = computedAge !== null && computedAge >= 14;

  useEffect(() => {
    const [d, m, y] = parseBirthDate(draft.birthDate);
    setLocalDay(d);
    setLocalMonth(m);
    setLocalYear(y);
  }, [draft.birthDate]);

  const trySyncDate = useCallback(
    (day: string, month: string, year: string) => {
      const valid = validateAndBuild(day, month, year);
      if (valid !== null) {
        setDraft((prev) => ({ ...prev, birthDate: valid }));
      } else if (draft.birthDate !== null) {
        setDraft((prev) => ({ ...prev, birthDate: null }));
      }
    },
    [draft.birthDate, setDraft],
  );

  const handleDayChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      setLocalDay(digits);
      trySyncDate(digits, localMonth, localYear);
      if (digits.length === 2) monthRef.current?.focus();
    },
    [localMonth, localYear, trySyncDate],
  );

  const handleMonthChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      setLocalMonth(digits);
      trySyncDate(localDay, digits, localYear);
      if (digits.length === 2) yearRef.current?.focus();
    },
    [localDay, localYear, trySyncDate],
  );

  const handleYearChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 4);
      setLocalYear(digits);
      trySyncDate(localDay, localMonth, digits);
    },
    [localDay, localMonth, trySyncDate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, target: 'day' | 'month' | 'year') => {
      if (e.key === 'Backspace' && target === 'month' && localMonth === '') {
        dayRef.current?.focus();
      }
      if (e.key === 'Backspace' && target === 'year' && localYear === '') {
        monthRef.current?.focus();
      }
    },
    [localMonth, localYear],
  );

  const toggleInterest = (interest: string) => {
    setDraft((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleGoal = (goal: string) => {
    setDraft((prev) => ({
      ...prev,
      relationshipGoals: prev.relationshipGoals.includes(goal)
        ? prev.relationshipGoals.filter((g) => g !== goal)
        : [...prev.relationshipGoals, goal],
    }));
  };

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 transition-colors';

  const dateInputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 transition-colors text-lg';

  return (
    <div className="px-4 py-6">
      <h2 className="text-lg font-bold text-white mb-5">Редактирование профиля</h2>

      <div className="flex flex-col gap-5">
        {/* Имя */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Имя</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Введи своё имя"
            className={inputClass}
          />
        </div>

        {/* Дата рождения */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Дата рождения</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                value={localDay}
                onChange={(e) => handleDayChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'day')}
                placeholder="ДД"
                maxLength={2}
                className={dateInputClass}
                aria-label="День"
              />
            </div>
            <div className="flex-1">
              <input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                value={localMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'month')}
                placeholder="ММ"
                maxLength={2}
                className={dateInputClass}
                aria-label="Месяц"
              />
            </div>
            <div className="flex-[1.5]">
              <input
                ref={yearRef}
                type="text"
                inputMode="numeric"
                value={localYear}
                onChange={(e) => handleYearChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'year')}
                placeholder="ГГГГ"
                maxLength={4}
                className={dateInputClass}
                aria-label="Год"
              />
            </div>
          </div>
          {computedAge !== null && computedAge >= 14 && (
            <p className="text-xs text-slate-500 mt-1">
              Возраст: {computedAge} {pluralizeAge(computedAge)}
            </p>
          )}
          {computedAge !== null && computedAge < 14 && (
            <p className="text-xs text-red-400 mt-1">
              Минимальный возраст для регистрации — 14 лет
            </p>
          )}
        </div>

        {/* Город */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Город</label>
          <input
            type="text"
            value={draft.city}
            onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="Москва"
            className={inputClass}
          />
        </div>

        {/* О себе */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">О себе</label>
          <textarea
            value={draft.bio}
            onChange={(e) => {
              if (e.target.value.length <= BIO_MAX_LENGTH) {
                setDraft((prev) => ({ ...prev, bio: e.target.value }));
              }
            }}
            placeholder="Расскажи немного о себе..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-slate-500 text-right mt-1">
            {draft.bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>

        {/* Интересы */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Интересы</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isActive = draft.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white border border-violet-500'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {draft.interests.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Выбрано: {draft.interests.length}
            </p>
          )}
        </div>

        {/* Цели */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Цели знакомств</label>
          <div className="flex flex-col gap-2">
            {AVAILABLE_RELATIONSHIP_GOALS.map((goal) => {
              const isActive = draft.relationshipGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`w-full px-5 py-3.5 rounded-xl text-left text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-all ${
                        isActive
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {isActive ? '✓' : ''}
                    </span>
                    {goal}
                  </span>
                </button>
              );
            })}
          </div>
          {draft.relationshipGoals.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Выбрано: {draft.relationshipGoals.length}
            </p>
          )}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex flex-col gap-3 mt-6 pb-6">
        <button
          onClick={onSave}
          disabled={!ageValid}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            ageValid
              ? 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {ageValid ? 'Сохранить' : 'Укажите корректную дату рождения'}
        </button>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 active:scale-[0.98] transition-all text-sm font-semibold"
        >
          Отмена
        </button>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 active:scale-[0.98] transition-all text-sm font-semibold"
        >
          Пересоздать анкету с нуля
        </button>
      </div>
    </div>
  );
}

/* ─── Главный компонент ─── */

export function ProfileTab() {
  const { form, updateField, resetForm } = useRegistration();
  const { navigateTo } = useScreen();
  const [isEditing, setIsEditing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleDeletePhoto = (index: number) => {
    const newPhotos = form.photos.filter((_, i) => i !== index);
    updateField('photos', newPhotos);
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField('photos', [...form.photos, reader.result as string]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Локальная копия формы для редактирования
  const [draft, setDraft] = useState<RegistrationForm>(form);

  // При входе в режим редактирования — копируем текущий form в draft
  useEffect(() => {
    if (isEditing) {
      setDraft({ ...form });
    }
  }, [isEditing, form]);

  const computedAge = draft.birthDate ? calculateAge(draft.birthDate) : null;
  const ageValid = computedAge !== null && computedAge >= 14;

  const handleSave = () => {
    if (!ageValid) return;
    updateField('name', draft.name);
    updateField('birthDate', draft.birthDate);
    updateField('city', draft.city);
    updateField('bio', draft.bio);
    updateField('interests', draft.interests);
    updateField('relationshipGoals', draft.relationshipGoals);
    updateField('photos', draft.photos);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...form });
    setIsEditing(false);
  };

  const handleResetFromScratch = () => {
    resetForm();
    navigateTo('welcome');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Превью карточки (всегда видно сверху) */}
      <ProfilePreview />

      {/* Кнопки управления профилем */}
      {!isEditing && (
        <div className="px-4 mt-5 flex flex-col gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            ✏️ Редактировать профиль
          </button>

          <button
            onClick={handleResetFromScratch}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            🔄 Пересоздать анкету с нуля
          </button>

          {/* Управление фотографиями */}
          {form.photos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-2 font-medium">Ваши фотографии ({form.photos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {form.photos.map((photo, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 group">
                    <button
                      onClick={() => setLightboxIndex(i)}
                      className="w-full h-full active:scale-[0.97] transition-transform"
                    >
                      <img src={photo} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(i)}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center text-xs hover:bg-red-500 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                      title="Удалить фото"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка добавления фото */}
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddPhoto}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/15 text-slate-400 hover:text-pink-400 hover:border-pink-500/30 active:scale-[0.98] transition-all text-sm font-medium"
            >
              + Добавить фото
            </button>
          </div>

          {/* Dev Tools */}
          <button
            onClick={() => setShowAdminPanel(true)}
            className="w-full py-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5 active:scale-[0.98] transition-all text-[11px] font-medium"
          >
            🛠️ Dev Tools
          </button>
        </div>
      )}

      {/* Форма редактирования (при скролле вниз) */}
      {isEditing && (
        <EditForm
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onCancel={handleCancel}
          onReset={handleResetFromScratch}
        />
      )}

      <AdminPanelModal isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

      {/* Лайтбокс для просмотра фото */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={form.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

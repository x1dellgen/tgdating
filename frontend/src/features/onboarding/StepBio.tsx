import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { calculateAge } from '../../shared/constants';

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

export function StepBio() {
  const { form, updateField } = useRegistration();
  const { name, birthDate, city, bio } = form;

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Локальный стейт для полей даты – инициализируется из birthDate в контексте
  const [localDay, setLocalDay] = useState('');
  const [localMonth, setLocalMonth] = useState('');
  const [localYear, setLocalYear] = useState('');

  // Синхронизация локального стейта при внешнем изменении birthDate (например, сброс формы)
  useEffect(() => {
    const [d, m, y] = parseBirthDate(birthDate);
    setLocalDay(d);
    setLocalMonth(m);
    setLocalYear(y);
  }, [birthDate]);

  const computedAge = useMemo(() => {
    if (!birthDate) return null;
    return calculateAge(birthDate);
  }, [birthDate]);

  const trySyncDate = useCallback(
    (day: string, month: string, year: string) => {
      const valid = validateAndBuild(day, month, year);
      // Обновляем birthDate только если дата полностью валидна; иначе не трогаем контекст
      // Если ранее была валидная дата, а теперь поля неполные – сбрасываем в null
      if (valid !== null) {
        updateField('birthDate', valid);
      } else if (birthDate !== null) {
        // Пользователь редактирует ранее валидную дату – сбрасываем
        updateField('birthDate', null);
      }
    },
    [birthDate, updateField],
  );

  const handleDayChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      setLocalDay(digits);
      trySyncDate(digits, localMonth, localYear);
      if (digits.length === 2) {
        monthRef.current?.focus();
      }
    },
    [localMonth, localYear, trySyncDate],
  );

  const handleMonthChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      setLocalMonth(digits);
      trySyncDate(localDay, digits, localYear);
      if (digits.length === 2) {
        yearRef.current?.focus();
      }
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

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 transition-colors text-lg';

  return (
    <div className="flex flex-col gap-5">
      {/* Имя */}
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Введи своё имя"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      {/* Дата рождения — 3 поля */}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
          value={city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Москва"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      {/* О себе */}
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">О себе</label>
        <textarea
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= BIO_MAX_LENGTH) {
              updateField('bio', e.target.value);
            }
          }}
          placeholder="Расскажи немного о себе..."
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors resize-none"
        />
        <p className="text-xs text-slate-500 text-right mt-1">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}

function pluralizeAge(age: number): string {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'лет';
  if (mod10 === 1) return 'год';
  if (mod10 >= 2 && mod10 <= 4) return 'года';
  return 'лет';
}

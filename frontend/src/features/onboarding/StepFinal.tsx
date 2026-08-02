import { useState } from 'react';
import { useRegistration, type OnboardingStep } from '../../context/RegistrationContext';
import { useScreen } from '../../context/ScreenContext';
import { calculateAge } from '../../shared/constants';

interface SummaryBlock {
  label: string;
  value: string;
  step: OnboardingStep;
  icon: string;
}

export function StepFinal() {
  const { form, goToStep } = useRegistration();
  const { navigateTo, redirectSource, setRedirectSource } = useScreen();
  const [showRedirectModal, setShowRedirectModal] = useState(true);

  const handleGoToSwipes = () => {
    if (redirectSource === 'anon') {
      setShowRedirectModal(true);
    } else {
      navigateTo('dating');
    }
  };

  const handleReturnToAnon = () => {
    setRedirectSource(null);
    navigateTo('anonymous-chat');
  };

  const handleGoToDating = () => {
    setRedirectSource(null);
    navigateTo('dating');
  };

  const handleEdit = (step: OnboardingStep) => {
    goToStep(step);
  };

  const computedAge = form.birthDate ? calculateAge(form.birthDate) : null;

  const summaryBlocks: SummaryBlock[] = [
    {
      label: 'Фото',
      value: `${form.photos.length} ${pluralize(form.photos.length, 'фото', 'фото', 'фото')}`,
      step: 1,
      icon: '📷',
    },
    {
      label: 'О себе',
      value: [form.name, computedAge && `${computedAge} лет`, form.city].filter(Boolean).join(', ') || '—',
      step: 2,
      icon: '👤',
    },
    {
      label: 'Интересы',
      value: form.interests.length > 0 ? form.interests.join(', ') : '—',
      step: 3,
      icon: '🎯',
    },
    {
      label: 'Цели',
      value: form.relationshipGoals.length > 0 ? form.relationshipGoals.join(', ') : '—',
      step: 4,
      icon: '💘',
    },
    {
      label: 'Поиск',
      value: form.searchingFor.searchEverywhere
        ? 'Везде'
        : `${genderLabel(form.searchingFor.gender)} ${form.searchingFor.ageRange[0]}–${form.searchingFor.ageRange[1]} лет${form.searchingFor.city ? ', ' + form.searchingFor.city : ''}`,
      step: 5,
      icon: '🔍',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      {/* Иконка/эмодзи */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <span className="text-3xl">🎉</span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">Почти готово!</h2>
        <p className="text-sm text-slate-400">Проверь анкету и нажми на блок, чтобы изменить.</p>
      </div>

      {/* Интерактивная сводка данных */}
      <div className="w-full flex flex-col gap-2">
        {summaryBlocks.map((block) => (
          <button
            key={block.step}
            type="button"
            onClick={() => handleEdit(block.step)}
            className="w-full bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{block.icon}</span>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{block.label}</span>
                  <span className="text-sm text-white font-medium line-clamp-2">
                    {block.value}
                  </span>
                </div>
              </div>
              <span className="text-slate-500 group-hover:text-blue-400 transition-colors text-sm">
                Изменить →
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoToSwipes}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-base hover:from-pink-600 hover:to-rose-600 transition-all active:scale-[0.98]"
      >
        Перейти к анкетам
      </button>

      {/* Модалка выбора направления после создания анкеты из анонимки */}
      {redirectSource === 'anon' && showRedirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowRedirectModal(false); handleGoToDating(); }}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Анкета создана!</h3>
            <p className="text-slate-400 text-xs text-center mb-5">Куда направимся дальше?</p>
            <div className="space-y-2.5">
              <button
                onClick={handleReturnToAnon}
                className="w-full py-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold text-sm hover:bg-violet-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="text-lg">🎭</span>
                <span>Вернуться в анонимный чат</span>
              </button>
              <button
                onClick={handleGoToDating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm hover:from-pink-400 hover:to-rose-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="text-lg">❤️</span>
                <span>Перейти в дейтинг</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Склоняет слово в зависимости от числа */
function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Возвращает читаемую метку пола */
function genderLabel(gender: string): string {
  if (gender === 'female') return 'Девушек';
  if (gender === 'male') return 'Парней';
  return 'Всех';
}

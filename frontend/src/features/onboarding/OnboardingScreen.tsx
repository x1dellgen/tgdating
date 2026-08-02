import { useRegistration } from '../../context/RegistrationContext';
import type { RegistrationForm } from '../../shared/constants';
import { calculateAge } from '../../shared/constants';
import { StepPhotos } from './StepPhotos';
import { StepBio } from './StepBio';
import { StepInterests } from './StepInterests';
import { StepGoals } from './StepGoals';
import { StepSearch } from './StepSearch';
import { StepFinal } from './StepFinal';

function isStepValid(step: number, form: RegistrationForm): boolean {
  switch (step) {
    case 1:
      return form.photos.length >= 3 && form.photos.length <= 6;
    case 2: {
      if (!form.birthDate) return false;
      const age = calculateAge(form.birthDate);
      return (
        form.name.trim().length > 0 &&
        age >= 14 &&
        age <= 99 &&
        form.city.trim().length > 0
      );
    }
    case 3:
      return form.interests.length >= 1;
    case 4:
      return form.relationshipGoals.length >= 1;
    case 5:
      return form.searchingFor.searchEverywhere || form.searchingFor.city.trim().length > 0;
    default:
      return true;
  }
}

export function OnboardingScreen() {
  const { currentStep, goNext, goBack, form } = useRegistration();

  const stepComponents: Record<number, React.ReactNode> = {
    1: <StepPhotos />,
    2: <StepBio />,
    3: <StepInterests />,
    4: <StepGoals />,
    5: <StepSearch />,
    6: <StepFinal />,
  };

  const isLastStep = currentStep === 6;
  const isFirstStep = currentStep === 1;
  const canProceed = isStepValid(currentStep, form);

  return (
    <div className="max-w-[500px] mx-auto h-[100dvh] flex flex-col bg-[#0b0f1a]">
      {/* Шапка */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        {/* Кнопка Назад */}
        <div className="w-14">
          {!isFirstStep && (
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              ← Назад
            </button>
          )}
        </div>

        {/* Индикатор шага */}
        <p className="text-sm text-slate-400">
          {currentStep} из 6
        </p>

        <div className="w-14" />
      </header>

      {/* Прогресс-бар */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 rounded-r"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Контент шага */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {stepComponents[currentStep]}
      </main>

      {/* Кнопка Продолжить (только для шагов 1–5) */}
      {!isLastStep && (
        <footer className="px-4 py-4 border-t border-slate-800">
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-base hover:from-pink-600 hover:to-rose-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Продолжить
          </button>
        </footer>
      )}
    </div>
  );
}
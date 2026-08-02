import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { RegistrationForm } from '../shared/constants';
import { DEFAULT_REGISTRATION_FORM } from '../shared/constants';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

const STORAGE_KEY = 'dateme_user_profile';

interface RegistrationContextValue {
  form: RegistrationForm;
  currentStep: OnboardingStep;
  updateField: <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) => void;
  goToStep: (step: OnboardingStep) => void;
  goNext: () => void;
  goBack: () => void;
  resetForm: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

function loadFromStorage(): { form: RegistrationForm; step: OnboardingStep } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Базовая валидация: проверяем, что есть поля photos и name
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.photos)) {
      return {
        form: {
          ...DEFAULT_REGISTRATION_FORM,
          ...parsed,
        },
        step: 6 as OnboardingStep,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(form: RegistrationForm, step: OnboardingStep) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, _step: step }));
  } catch {
    // localStorage может быть переполнен или недоступен — молча игнорируем
  }
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const saved = loadFromStorage();

  const [form, setForm] = useState<RegistrationForm>(
    saved?.form ?? DEFAULT_REGISTRATION_FORM,
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    saved?.step ?? 1,
  );

  // Автосохранение при любом изменении формы или шага
  useEffect(() => {
    saveToStorage(form, currentStep);
  }, [form, currentStep]);

  const updateField = useCallback(
    <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 6) as OnboardingStep);
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as OnboardingStep);
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_REGISTRATION_FORM);
    setCurrentStep(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <RegistrationContext.Provider
      value={{ form, currentStep, updateField, goToStep, goNext, goBack, resetForm }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('useRegistration must be used within <RegistrationProvider>');
  }
  return ctx;
}
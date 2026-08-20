import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { RegistrationForm } from '../shared/constants';
import { DEFAULT_REGISTRATION_FORM, calculateAge } from '../shared/constants';
import { http, UPLOADS_BASE_URL } from '../api/client';
import type { ApiUser } from '../api/types';

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
  /** Загрузить профиль из API (GET /api/users/me) */
  loadProfile: () => Promise<boolean>;
  /** Сохранить профиль в API (PUT /api/users/me) */
  saveProfile: () => Promise<boolean>;
  /** Загрузить фотографии на сервер (POST /api/users/me/photos) */
  uploadPhotos: (files: File[]) => Promise<string[]>;
  /** Флаг: профиль загружен из API */
  profileLoaded: boolean;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

function loadFromStorage(): { form: RegistrationForm; step: OnboardingStep } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
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
    // ignore
  }
}

/** Преобразует URL фото: если это относительный путь бэкенда, добавляет базовый URL */
function resolvePhotoUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${url}`;
  }
  return url;
}

/** Преобразует API-профиль в RegistrationForm */
function mapApiUserToForm(user: ApiUser): RegistrationForm {
  return {
    photos: user.photos.map(resolvePhotoUrl),
    name: user.name || '',
    birthDate: user.age ? null : null, // age приходит как число, а birthDate — строка; точную дату не восстановить
    city: user.city || '',
    bio: user.bio || '',
    interests: user.interests || [],
    relationshipGoals: user.purpose ? [user.purpose] : [],
    searchingFor: {
      gender: (user.targetGender as RegistrationForm['searchingFor']['gender']) || 'all',
      ageRange: [18, 29],
      city: '',
      searchEverywhere: false,
    },
  };
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const saved = loadFromStorage();

  const [form, setForm] = useState<RegistrationForm>(
    saved?.form ?? DEFAULT_REGISTRATION_FORM,
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    saved?.step ?? 1,
  );
  const [profileLoaded, setProfileLoaded] = useState(false);

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

  /* ─── API: Загрузка профиля ─── */

  const loadProfile = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await http.get<ApiUser>('/api/users/me');

      if (data.hasProfile) {
        const loadedForm = mapApiUserToForm(data);
        // Если есть birthDate в localStorage — восстанавливаем
        const savedData = loadFromStorage();
        if (savedData?.form.birthDate && !loadedForm.birthDate) {
          loadedForm.birthDate = savedData.form.birthDate;
        }
        setForm(loadedForm);
        setCurrentStep(6);
        setProfileLoaded(true);
        return true;
      }
      setProfileLoaded(true);
      return false;
    } catch (err) {
      console.error('[RegistrationContext] Ошибка загрузки профиля:', err);
      setProfileLoaded(true);
      return false;
    }
  }, []);

  /* ─── API: Сохранение профиля ─── */

  const saveProfile = useCallback(async (): Promise<boolean> => {
    try {
      const age = form.birthDate ? calculateAge(form.birthDate) : null;

      // Сначала загружаем фото, которые ещё в base64
      const serverPhotos: string[] = [];
      const base64Photos: string[] = [];

      for (const photo of form.photos) {
        if (photo.startsWith('data:')) {
          base64Photos.push(photo);
        } else if (photo.startsWith('/uploads/') || photo.startsWith('http')) {
          serverPhotos.push(photo);
        }
      }

      // Загружаем base64 фото на сервер
      if (base64Photos.length > 0) {
        const uploadedUrls = await uploadBase64Photos(base64Photos);
        serverPhotos.push(...uploadedUrls);
      }

      await http.put('/api/users/me', {
        name: form.name,
        age,
        city: form.city,
        gender: null, // пол не задаётся в текущей форме
        targetGender: form.searchingFor.gender,
        bio: form.bio,
        purpose: form.relationshipGoals[0] || null,
        interests: form.interests,
        hasProfile: true,
      });

      // Обновляем фото в профиле на сервере, если загрузили новые
      if (serverPhotos.length > 0 && serverPhotos.some((p) => p.startsWith('/uploads/'))) {
        // Фото уже были загружены через uploadPhotos или выше
      }

      return true;
    } catch (err) {
      console.error('[RegistrationContext] Ошибка сохранения профиля:', err);
      return false;
    }
  }, [form]);

  /* ─── API: Загрузка фотографий ─── */

  const uploadPhotos = useCallback(async (files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));

      const { data } = await http.post<{ photos: string[] }>(
        '/api/users/me/photos',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      return data.photos.map(resolvePhotoUrl);
    } catch (err) {
      console.error('[RegistrationContext] Ошибка загрузки фото:', err);
      return [];
    }
  }, []);

  return (
    <RegistrationContext.Provider
      value={{
        form,
        currentStep,
        updateField,
        goToStep,
        goNext,
        goBack,
        resetForm,
        loadProfile,
        saveProfile,
        uploadPhotos,
        profileLoaded,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

/** Вспомогательная функция: загружает base64-фото на сервер */
async function uploadBase64Photos(base64Photos: string[]): Promise<string[]> {
  try {
    const files: File[] = [];

    for (const base64 of base64Photos) {
      const res = await fetch(base64);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const file = new File([blob], `photo_${Date.now()}.${ext}`, { type: blob.type });
      files.push(file);
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    const { data } = await http.post<{ photos: string[] }>(
      '/api/users/me/photos',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return data.photos.map(resolvePhotoUrl);
  } catch (err) {
    console.error('[RegistrationContext] Ошибка загрузки base64 фото:', err);
    return [];
  }
}

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('useRegistration must be used within <RegistrationProvider>');
  }
  return ctx;
}
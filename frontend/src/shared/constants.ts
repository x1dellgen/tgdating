/** Допустимые экраны приложения */
export type Screen = 'welcome' | 'onboarding' | 'dating' | 'swipes' | 'anonymous-chat';

/** Заголовки экранов-заглушек */
export const PLACEHOLDER_TEXTS: Record<Exclude<Screen, 'welcome' | 'onboarding'>, string> = {
  dating: 'Dating Shell — В разработке',
  swipes: 'Экран Свайпов — В разработке',
  'anonymous-chat': 'Экран Анонимного чата — В разработке',
} as const;

/** Типы для формы регистрации */

export type Gender = 'male' | 'female' | 'all';

export interface SearchPreferences {
  gender: Gender;
  ageRange: [number, number];
  city: string;
  searchEverywhere: boolean;
}

export interface RegistrationForm {
  photos: string[];
  name: string;
  birthDate: string | null;
  city: string;
  bio: string;
  interests: string[];
  relationshipGoals: string[];
  searchingFor: SearchPreferences;
}

export const DEFAULT_REGISTRATION_FORM: RegistrationForm = {
  photos: [],
  name: '',
  birthDate: null,
  city: '',
  bio: '',
  interests: [],
  relationshipGoals: [],
  searchingFor: {
    gender: 'all',
    ageRange: [18, 29],
    city: '',
    searchEverywhere: false,
  },
};

/** Вычисляет возраст по дате рождения (ISO-строка YYYY-MM-DD) */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Доступные интересы */
export const AVAILABLE_INTERESTS = [
  'Музыка',
  'Кино',
  'Спорт',
  'Игры',
  'Путешествия',
  'Книги',
  'Фотография',
  'Кулинария',
  'Танцы',
  'Йога',
  'Технологии',
  'Искусство',
  'Природа',
  'Животные',
  'Автомобили',
  'Ролевые игры',
  'Взрослые разговоры 18+',
  'Косплей',
] as const;

/** Доступные цели отношений */
export const AVAILABLE_RELATIONSHIP_GOALS = [
  'Серьёзные отношения',
  'Дружба',
  'Создание семьи',
  'Общение',
  'Свидания',
  'Не знаю пока',
] as const;
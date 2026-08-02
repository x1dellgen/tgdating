export interface MockProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  interests: string[];
  goal: string;
  isAdult?: boolean;
}

export const mockProfiles: MockProfile[] = [
  {
    id: 'profile-1',
    name: 'Анна',
    age: 24,
    city: 'Москва',
    bio: 'Люблю путешествовать и открывать новые места. По выходным играю на гитаре и рисую акварелью.',
    photos: [
      'https://picsum.photos/seed/anna1/400/600',
      'https://picsum.photos/seed/anna2/400/600',
      'https://picsum.photos/seed/anna3/400/600',
    ],
    interests: ['Музыка', 'Путешествия', 'Искусство', 'Кулинария', 'Ролевые игры'],
    goal: 'Серьёзные отношения',
    isAdult: true,
  },
  {
    id: 'profile-2',
    name: 'Дмитрий',
    age: 27,
    city: 'Санкт-Петербург',
    bio: 'IT-предприниматель, люблю спорт и активный отдых. Ищу единомышленницу для совместных приключений.',
    photos: [
      'https://picsum.photos/seed/dima1/400/600',
      'https://picsum.photos/seed/dima2/400/600',
    ],
    interests: ['Спорт', 'Технологии', 'Путешествия', 'Кино', 'Ролевые игры'],
    goal: 'Дружба',
    isAdult: true,
  },
  {
    id: 'profile-3',
    name: 'Екатерина',
    age: 22,
    city: 'Казань',
    bio: 'Студентка архитектурного. Обожаю фотографию, долгие прогулки и уютные вечера с книгой.',
    photos: [
      'https://picsum.photos/seed/katya1/400/600',
      'https://picsum.photos/seed/katya2/400/600',
      'https://picsum.photos/seed/katya3/400/600',
    ],
    interests: ['Фотография', 'Книги', 'Искусство', 'Природа'],
    goal: 'Общение',
  },
  {
    id: 'profile-4',
    name: 'Алексей',
    age: 29,
    city: 'Новосибирск',
    bio: 'Врач по профессии, романтик в душе. Ценю искренность и чувство юмора. Люблю готовить.',
    photos: [
      'https://picsum.photos/seed/alexey1/400/600',
      'https://picsum.photos/seed/alexey2/400/600',
    ],
    interests: ['Кулинария', 'Кино', 'Йога', 'Животные'],
    goal: 'Создание семьи',
  },
  {
    id: 'profile-5',
    name: 'Мария',
    age: 25,
    city: 'Екатеринбург',
    bio: 'Дизайнер интерьеров. Создаю красоту вокруг себя и ищу того, с кем можно разделить эту красоту.',
    photos: [
      'https://picsum.photos/seed/maria1/400/600',
      'https://picsum.photos/seed/maria2/400/600',
      'https://picsum.photos/seed/maria3/400/600',
    ],
    interests: ['Искусство', 'Танцы', 'Путешествия', 'Музыка'],
    goal: 'Свидания',
  },
  {
    id: 'profile-6',
    name: 'Сергей',
    age: 31,
    city: 'Краснодар',
    bio: 'Люблю горы, велосипед и хорошую компанию. Работаю удалённо, поэтому открыт к знакомствам по всей стране.',
    photos: [
      'https://picsum.photos/seed/sergey1/400/600',
      'https://picsum.photos/seed/sergey2/400/600',
    ],
    interests: ['Спорт', 'Природа', 'Игры', 'Автомобили', 'Ролевые игры'],
    goal: 'Дружба',
    isAdult: true,
  },
  {
    id: 'profile-7',
    name: 'Ольга',
    age: 26,
    city: 'Сочи',
    bio: 'Живу у моря и не представляю жизни без него. Йога по утрам, кофе и хорошая музыка — мой рецепт счастья.',
    photos: [
      'https://picsum.photos/seed/olga1/400/600',
      'https://picsum.photos/seed/olga2/400/600',
    ],
    interests: ['Йога', 'Музыка', 'Природа', 'Кулинария'],
    goal: 'Серьёзные отношения',
  },
  // Подростковые анкеты (14–17) для тестирования возрастного ценза
  {
    id: 'profile-8',
    name: 'Алиса',
    age: 16,
    city: 'Москва',
    bio: 'Учусь в 10 классе, люблю рисовать и слушать музыку. Ищу друзей по интересам.',
    photos: [
      'https://picsum.photos/seed/alisa1/400/600',
      'https://picsum.photos/seed/alisa2/400/600',
    ],
    interests: ['Музыка', 'Искусство', 'Книги', 'Кино'],
    goal: 'Дружба',
  },
  {
    id: 'profile-9',
    name: 'Максим',
    age: 15,
    city: 'Санкт-Петербург',
    bio: 'Занимаюсь спортом, играю в футбол. Обожаю видеоигры и прогулки с друзьями.',
    photos: [
      'https://picsum.photos/seed/maxim1/400/600',
      'https://picsum.photos/seed/maxim2/400/600',
    ],
    interests: ['Спорт', 'Игры', 'Кино', 'Технологии'],
    goal: 'Общение',
  },
  {
    id: 'profile-10',
    name: 'Полина',
    age: 17,
    city: 'Казань',
    bio: 'Выпускница, готовлюсь к поступлению. Люблю танцевать и фотографировать.',
    photos: [
      'https://picsum.photos/seed/polina1/400/600',
      'https://picsum.photos/seed/polina2/400/600',
      'https://picsum.photos/seed/polina3/400/600',
    ],
    interests: ['Танцы', 'Фотография', 'Музыка', 'Путешествия'],
    goal: 'Дружба',
  },
  {
    id: 'profile-11',
    name: 'Артём',
    age: 14,
    city: 'Новосибирск',
    bio: 'Увлекаюсь программированием и робототехникой. Ищу компанию для совместных проектов.',
    photos: [
      'https://picsum.photos/seed/artem1/400/600',
    ],
    interests: ['Технологии', 'Игры', 'Кино', 'Спорт'],
    goal: 'Общение',
  },
  {
    id: 'profile-12',
    name: 'Виктория',
    age: 20,
    city: 'Екатеринбург',
    bio: 'Студентка журфака. Пишу стихи, люблю кофе и долгие разговоры за жизнь.',
    photos: [
      'https://picsum.photos/seed/vika1/400/600',
      'https://picsum.photos/seed/vika2/400/600',
    ],
    interests: ['Книги', 'Кулинария', 'Искусство', 'Природа'],
    goal: 'Серьёзные отношения',
  },
];

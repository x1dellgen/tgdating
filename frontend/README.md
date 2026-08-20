# Frontend — Vibe Dating Mini App

React-приложение для Telegram Mini App — клиентская часть платформы знакомств.

## Стек

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Axios (HTTP-клиент)
- Socket.io Client (реалтайм)
- Telegram Web App SDK (`@twa-dev/sdk`)

## Структура

```
src/
├── api/                 # HTTP-клиент, типы API, мапперы
├── components/ui/       # Переиспользуемые UI-компоненты
├── context/             # React Context (Screen, Registration, Match, Chat, AnonymousChat)
├── features/
│   ├── anonymous-chat/  # Анонимный чат
│   ├── dating/          # Основной shell: вкладки (Каталог, Лайки, Чаты, Профиль)
│   ├── matching/        # Match overlay
│   ├── onboarding/      # Пошаговая регистрация (6 шагов)
│   ├── swipes/          # Лента свайпов
│   └── welcome/         # Welcome screen
├── hooks/               # Кастомные хуки (useTelegram)
└── shared/              # Константы, типы, утилиты
```

## Запуск

```bash
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`.

## Переменные окружения

| Переменная       | По умолчанию              | Описание            |
| ---------------- | ------------------------- | ------------------- |
| `VITE_API_URL`   | `http://localhost:5000`   | URL бэкенда         |

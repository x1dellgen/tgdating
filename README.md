# Vibe Dating — Telegram Dating Mini App

[![CI](https://github.com/x1dellgen/tgdating/actions/workflows/ci.yml/badge.svg)](https://github.com/x1dellgen/tgdating/actions)

Платформа знакомств и анонимного чата, встроенная в Telegram как Mini App. Пользователи создают анкету, свайпают профили, общаются в матчах и находят случайных собеседников в анонимном чате.

> Pet-проект, разработанный с использованием AI-assisted development (Cursor, Claude, ChatGPT).

## Screenshots

<!-- 
  TODO: добавить скриншоты в docs/screenshots/ и раскомментировать:

  ![Welcome Screen](docs/screenshots/welcome.png)
  ![Onboarding](docs/screenshots/onboarding.png)
  ![Swipes](docs/screenshots/swipes.png)
  ![Match](docs/screenshots/match.png)
  ![Chat](docs/screenshots/chat.png)
  ![Catalog](docs/screenshots/catalog.png)
  ![Anonymous Chat](docs/screenshots/anonymous-chat.png)
-->

## Реализованные функции

- **Регистрация** — пошаговый онбординг (6 шагов): имя, дата рождения, город, био, интересы, цели, фото, параметры поиска
- **Свайпы** — карточки профилей с жестами (лайк / пропуск / суперлайк)
- **Мэтчинг** — автоматическое определение взаимной симпатии с анимацией
- **Мессенджер** — чаты в стиле Telegram (пузырьки, автоскролл, индикатор набора)
- **Каталог** — поиск и фильтрация анкет по имени, городу, целям, интересам
- **Анонимный чат** — поиск случайного собеседника с выбором темы и пола
- **Профиль** — редактирование, загрузка фото, сброс анкеты
- **Возрастной ценз** — жёсткое разделение 14–17 / 18+
- **Backend API** — REST + WebSocket с JWT-авторизацией через Telegram initData
- **База данных** — PostgreSQL (Supabase) через Prisma ORM

## Текущий статус

Backend полностью реализован. Frontend работает с mock-данными, идёт интеграция с REST API. Подробности в [ROADMAP.md](docs/ROADMAP.md).

## Технологический стек

### Frontend

| Технология          | Версия | Назначение                    |
| ------------------- | ------ | ----------------------------- |
| React               | 19     | UI-фреймворк                  |
| TypeScript          | 6      | Типизация                     |
| Vite                | 8      | Сборка и dev-сервер           |
| Tailwind CSS        | 3      | Стилизация                    |
| Axios               | 1      | HTTP-клиент                   |
| Socket.io Client    | 4      | WebSocket-подключение         |
| Telegram Web App SDK| 8      | Интеграция с Telegram         |

### Backend

| Технология       | Версия | Назначение                    |
| ---------------- | ------ | ----------------------------- |
| Node.js          | ≥18    | Серверная среда               |
| Express          | 5      | HTTP-сервер                   |
| TypeScript       | 5      | Типизация                     |
| Prisma           | 6      | ORM для PostgreSQL             |
| Socket.io        | 4      | WebSocket-сервер              |
| JWT (jsonwebtoken)| 9      | Авторизация                   |
| Multer           | 2      | Загрузка файлов               |

### Инфраструктура

| Компонент     | Технология          |
| ------------- | ------------------- |
| База данных   | PostgreSQL (Supabase)|
| Контейнеры    | Docker Compose      |

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Client                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Telegram Mini App (Frontend)             │  │
│  │  React + Vite + TypeScript + Tailwind CSS          │  │
│  │  Telegram Web App SDK → initData → JWT             │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │ HTTP + WebSocket                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              Backend (Express + TS)                │  │
│  │  REST API: /api/users, /api/swipes, /api/matches  │  │
│  │  WebSocket: Socket.io (реалтайм-сообщения)        │  │
│  │  Auth: JWT через Telegram initData (HMAC-SHA256)  │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │ Prisma ORM                       │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │           PostgreSQL (Supabase / Local)            │  │
│  │  User, Like, Match, Message, AnonSession,         │  │
│  │  AnonMessage                                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Ключевые файлы

| Файл | Назначение |
| ---- | ---------- |
| `backend/src/server.ts` | Точка входа: Express + HTTP + Socket.io |
| `backend/src/middleware/auth.middleware.ts` | JWT-авторизация через Telegram initData |
| `backend/src/routes/users.ts` | CRUD профиля, загрузка фото |
| `backend/src/routes/swipes.ts` | Лента анкет, лайки, мэтчинг |
| `backend/src/routes/matches.ts` | Мэтчи, входящие лайки, история сообщений |
| `backend/src/socket.ts` | WebSocket: реалтайм-сообщения, анонимный чат |
| `backend/src/lib/prisma.ts` | Синглтон Prisma Client |
| `backend/src/lib/upload.ts` | Конфигурация Multer (фото, аудио) |
| `backend/prisma/schema.prisma` | Схема базы данных |
| `frontend/src/App.tsx` | Корневой компонент, роутинг, провайдеры |
| `frontend/src/api/client.ts` | HTTP + Socket.io клиент, авторизация |
| `frontend/src/context/` | React Context: Screen, Registration, Match, Chat |
| `frontend/src/features/` | Фичи: swipes, dating, onboarding, anonymous-chat |

## Структура репозитория

```
tma-dating/
├── backend/
│   ├── prisma/schema.prisma     # Схема БД
│   ├── src/
│   │   ├── lib/                 # Prisma, Multer
│   │   ├── middleware/          # JWT auth
│   │   ├── routes/              # REST endpoints
│   │   ├── server.ts            # Точка входа
│   │   └── socket.ts            # WebSocket
│   ├── uploads/                 # Загруженные файлы
│   ├── docker-compose.yml       # Локальная PostgreSQL
│   ├── .env.example             # Шаблон переменных
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # HTTP-клиент, типы
│   │   ├── components/ui/       # UI-компоненты
│   │   ├── context/             # React Context
│   │   ├── features/            # Фичи по папкам
│   │   ├── hooks/               # useTelegram
│   │   └── shared/              # Константы, типы
│   ├── README.md
│   └── package.json
├── docs/
│   ├── screenshots/             # Скриншоты приложения
│   ├── CHANGELOG.md
│   ├── ROADMAP.md
│   ├── DESIGN_BIBLE.md
│   └── AI_RULES.md
├── .gitignore
└── README.md
```

## Локальный запуск

### Предварительные требования

- Node.js ≥ 18
- Docker (для локальной PostgreSQL) или аккаунт Supabase

### 1. Клонировать репозиторий

```bash
git clone https://github.com/x1dellgen/tgdating.git
cd tgdating
```

### 2. Настроить переменные окружения

```bash
cp backend/.env.example backend/.env
```

Отредактируйте `backend/.env` — заполните `BOT_TOKEN`, `JWT_SECRET` и `DATABASE_URL`.

### 3. Запустить базу данных

**Вариант A — Docker:**

```bash
cd backend
docker compose up -d
```

**Вариант B — Supabase:**

Используйте строку подключения из Supabase Dashboard → Settings → Database.

### 4. Применить миграции и сгенерировать клиент

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 5. Запустить backend

```bash
cd backend
npm install
npm run dev
```

Backend: `http://localhost:5000`

### 6. Запустить frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

| Переменная     | Описание                                    | Обязательна |
| -------------- | ------------------------------------------- | ----------- |
| `PORT`         | Порт сервера (по умолчанию `5000`)          | Нет         |
| `DATABASE_URL` | Строка подключения PostgreSQL               | Да          |
| `DIRECT_URL`   | Прямое подключение (для Prisma migrations)  | Для Supabase|
| `BOT_TOKEN`    | Токен Telegram Bot                          | Да          |
| `JWT_SECRET`   | Секретный ключ для JWT (минимум 32 символа) | Да          |
| `MINI_APP_URL` | URL Mini App (для бота)                     | Нет         |

### Frontend (`frontend/.env`)

| Переменная     | Описание          | По умолчанию            |
| -------------- | ----------------- | ----------------------- |
| `VITE_API_URL` | URL бэкенда       | `http://localhost:5000` |

## API Endpoints

### Публичные

| Метод | Путь                  | Описание                        |
| ----- | --------------------- | ------------------------------- |
| GET   | `/api/health`         | Проверка здоровья сервера       |
| POST  | `/api/auth/telegram`  | Авторизация через Telegram initData |

### Защищённые (требуют JWT)

| Метод  | Путь                         | Описание                         |
| ------ | ---------------------------- | -------------------------------- |
| GET    | `/api/users/me`              | Текущий профиль                  |
| PUT    | `/api/users/me`              | Создать/обновить профиль         |
| POST   | `/api/users/me/photos`       | Загрузить фото (до 10 шт.)      |
| DELETE | `/api/users/me/photos`       | Удалить фото                     |
| DELETE | `/api/users/me`              | Сбросить профиль                 |
| GET    | `/api/swipes/feed`           | Лента анкет (фильтры: gender, age)|
| POST   | `/api/swipes/like`           | Лайк / дизлайк / суперлайк      |
| GET    | `/api/matches`               | Активные мэтчи                   |
| GET    | `/api/matches/likes`         | Входящие лайки                   |
| GET    | `/api/matches/:id/messages`  | История сообщений (cursor-based) |

### Health Check

```bash
curl http://localhost:5000/api/health
# {"status":"ok","timestamp":"...","uptime":...}
```

## Development

### Команды backend

```bash
cd backend
npm run dev          # Запуск с hot-reload (tsx watch)
npm run build        # Компиляция TypeScript
npm run start        # Запуск скомпилированного кода
npm run db:push      # Применить схему в БД
npm run db:generate  # Сгенерировать Prisma Client
npm run db:studio    # Открыть Prisma Studio (GUI)
```

### Команды frontend

```bash
cd frontend
npm run dev          # Dev-сервер Vite
npm run build        # Продакшн-сборка
npm run preview      # Предпросмотр сборки
npm run lint         # ESLint
```

## Тесты

В проекте пока нет автоматизированных тестов. Это запланировано в [ROADMAP.md](docs/ROADMAP.md).

## AI-assisted Development

Проект разработан с активным использованием AI-инструментов:

- **Cursor** — основной IDE с AI-автодополнением
- **Claude / ChatGPT** — генерация кода, архитектурные решения, ревью
- **AI Rules** — проект включает файл [`docs/AI_RULES.md`](docs/AI_RULES.md) с правилами для AI-ассистентов, обеспечивающими консистентность кода

Подход: итеративная разработка, один экран = один модуль, zero tech debt.

## GitHub Topics

```
telegram  telegram-mini-app  react  typescript  nodejs  express
prisma  postgresql  supabase  dating-app  websocket  socketio
tailwindcss  vite  ai-assisted-development
```

## Лицензия

Проект является pet-project и не имеет лицензии. Код открыт для изучения.

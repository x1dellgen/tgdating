# Vibe Dating — Telegram Dating Mini App

[![CI](https://github.com/x1dellgen/tgdating/actions/workflows/ci.yml/badge.svg)](https://github.com/x1dellgen/tgdating/actions)

Платформа знакомств и анонимного чата, встроенная в Telegram как Mini App. Пользователи создают анкету, свайпают профили, общаются в матчах и находят случайных собеседников в анонимном чате.

> Pet-проект, разработанный с использованием AI-assisted development (Cline, OpenRouter, DeepSeek, Gemini, ChatGPT, Mimo).

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

### AI-Assisted Workflow

| Инструмент      | Назначение                              |
| --------------- | --------------------------------------- |
| Cline           | VS Code AI-агент                        |
| OpenRouter      | LLM Routing (маршрутизация запросов)    |
| DeepSeek        | Генерация кода, архитектура             |
| Gemini          | Генерация кода, ревью                   |
| ChatGPT         | Генерация кода, архитектурные решения   |
| Mimo            | AI-ассистент                            |

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
│   ├── prisma/
│   │   ├── schema.prisma         # Схема БД
│   │   └── migrations/           # Prisma миграции
│   ├── src/
│   │   ├── lib/                  # Prisma, Multer
│   │   ├── middleware/           # JWT auth
│   │   ├── routes/               # REST endpoints
│   │   ├── server.ts             # Точка входа
│   │   └── socket.ts             # WebSocket
│   ├── uploads/                  # Загруженные файлы
│   ├── docker-entrypoint.sh      # Entrypoint для Docker (migrations + start)
│   ├── Dockerfile                # Multi-stage production build
│   ├── .env.example              # Шаблон переменных
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # HTTP-клиент, типы
│   │   ├── components/ui/        # UI-компоненты
│   │   ├── context/              # React Context
│   │   ├── features/             # Фичи по папкам
│   │   ├── hooks/                # useTelegram
│   │   └── shared/               # Константы, типы
│   ├── nginx.conf                # Nginx конфигурация (прокси на backend)
│   ├── Dockerfile                # Multi-stage build (Node → Nginx)
│   ├── README.md
│   └── package.json
├── docs/
│   ├── screenshots/              # Скриншоты приложения
│   ├── CHANGELOG.md
│   ├── ROADMAP.md
│   ├── DESIGN_BIBLE.md
│   └── AI_RULES.md
├── docker-compose.yml            # Production Docker Compose
├── .env.example                  # Шаблон переменных для Docker Compose
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
npx prisma migrate deploy   # Применить миграции (production)
npx prisma generate          # Сгенерировать Prisma Client
```

> **Для локальной разработки** можно использовать `npx prisma db push` для быстрого прототипирования.
> **Для production** всегда используйте `prisma migrate deploy`.

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

## Docker Deployment

Проект полностью контейнеризирован. Для запуска через Docker Compose:

### 1. Клонировать и настроить

```bash
git clone https://github.com/x1dellgen/tgdating.git
cd tgdating
cp .env.example .env
```

Отредактируйте `.env` — заполните `BOT_TOKEN` и `JWT_SECRET` (минимум 32 символа).

### 2. Собрать и запустить

```bash
docker compose up --build
```

### 3. Проверить

```bash
curl http://localhost:5000/api/health
# {"status":"ok","timestamp":"...","uptime":...}
```

### Архитектура контейнеров

```
docker-compose.yml
├── postgres (postgres:16-alpine)
│   ├── port: 5432
│   ├── volume: pgdata → /var/lib/postgresql/data
│   └── healthcheck: pg_isready
│
├── backend (node:20-alpine, multi-stage build)
│   ├── port: 5000
│   ├── depends_on: postgres (service_healthy)
│   ├── healthcheck: GET /api/health
│   ├── entrypoint: prisma migrate deploy → node dist/server.js
│   └── volume: uploads → /app/uploads
│
└── frontend (nginx:alpine)
    ├── port: 80
    ├── depends_on: backend (service_healthy)
    └── nginx proxy: /api/ → backend:5000
```

### Управление контейнерами

```bash
docker compose up -d              # Запуск в фоне
docker compose down               # Остановить (данные сохраняются)
docker compose logs -f backend    # Логи backend
docker compose logs -f postgres   # Логи PostgreSQL
```

> ⚠️ **Внимание:** `docker compose down` **НЕ удаляет** volumes — данные PostgreSQL сохраняются.
>
> ⚠️ `docker compose down -v` **УДАЛЯЕТ** volumes и все данные PostgreSQL. Используйте только для полного сброса.

### Prisma миграции в Docker

При каждом запуске контейнера backend автоматически выполняет `prisma migrate deploy` перед стартом сервера (через `docker-entrypoint.sh`). Это применяет все pending миграции к базе данных.

**НЕ используйте `prisma db push` в production.**

## Environment Variables

### Docker Compose (`.env` в корне проекта)

| Переменная         | Описание                                    | По умолчанию |
| ------------------ | ------------------------------------------- | ------------ |
| `POSTGRES_USER`    | Пользователь PostgreSQL                     | `postgres`   |
| `POSTGRES_PASSWORD`| Пароль PostgreSQL                           | `postgres`   |
| `POSTGRES_DB`      | Имя базы данных                             | `tmadating`  |
| `BOT_TOKEN`        | Токен Telegram Bot                          | —            |
| `JWT_SECRET`       | Секретный ключ для JWT (минимум 32 символа) | —            |

### Backend (`backend/.env` — для локальной разработки без Docker)

| Переменная     | Описание                                    | Обязательна |
| -------------- | ------------------------------------------- | ----------- |
| `PORT`         | Порт сервера (по умолчанию `5000`)          | Нет         |
| `DATABASE_URL` | Строка подключения PostgreSQL               | Да          |
| `DIRECT_URL`   | Прямое подключение (для Prisma migrations)  | Для Supabase|
| `BOT_TOKEN`    | Токен Telegram Bot                          | Да          |
| `JWT_SECRET`   | Секретный ключ для JWT (минимум 32 символа) | Да          |

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
npm run dev              # Запуск с hot-reload (tsx watch)
npm run build            # Компиляция TypeScript
npm run start            # Запуск скомпилированного кода

# Prisma — Development (быстрое прототипирование)
npm run db:push          # Применить схему напрямую в БД (dev only!)
npm run db:generate      # Сгенерировать Prisma Client
npm run db:studio        # Открыть Prisma Studio (GUI)

# Prisma — Production (миграции)
npm run db:migrate:dev       # Создать новую миграцию (dev)
npm run db:migrate:deploy    # Применить миграции (production)
npm run db:migrate:status    # Статус миграций
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

Backend содержит **79 автоматизированных тестов** (4 тест-файла):

| Файл | Тестов |
| ---- | ------ |
| `env.test.ts` | 8 |
| `schemas.test.ts` | 15 |
| `socket.test.ts` | 49 |
| `api.test.ts` | 7 |

```bash
cd backend
npm test          # vitest run → 79/79 passed
```

Тесты покрывают: валидацию окружения, Zod-схемы, REST API (health, auth, users, swipes, matches, chat), WebSocket-события и rate limiting.

## Деплой базы данных

### Чистая PostgreSQL БД (новая)

Для новой базы данных, где таблиц ещё нет:

```bash
npx prisma migrate deploy
```

### Существующая Supabase БД (таблицы уже созданы через `prisma db push`)

Если таблицы уже были созданы вручную через `prisma db push`, необходимо сначала отметить baseline-миграцию как применённую:

```bash
# 1. Отметить baseline-миграцию как уже применённую
npx prisma migrate resolve --applied 20260821000000_init_baseline

# 2. Проверить статус миграций
npx prisma migrate status

# 3. Применить будущие миграции (если появятся)
npx prisma migrate deploy
```

> ⚠️ Шаг 3 (`migrate deploy`) необходим только при появлении новых миграций после baseline.

## AI-assisted Development

Проект разработан с активным использованием AI-инструментов:

- **Cline** — VS Code AI-агент для генерации и рефакторинга кода
- **OpenRouter** — маршрутизация LLM-запросов (DeepSeek, Gemini, ChatGPT)
- **DeepSeek / Gemini / ChatGPT** — генерация кода, архитектурные решения, ревью
- **Mimo** — AI-ассистент
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

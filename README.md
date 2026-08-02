# TMA Dating — Telegram Mini App

Платформа знакомств и анонимного чата, встроенная в экосистему Telegram.

## Окружение

* **Node.js** ≥ 18
* **npm** ≥ 9 (поставляется с Node.js)
* **Telegram Web App** — доступ через `window.Telegram.WebApp`

## Быстрый старт

```bash
# Перейти в папку фронтенда
cd frontend

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## Структура проекта

```
tma-dating/
├── backend/         # Серверная часть (заглушка)
├── frontend/        # Клиентское React-приложение
├── docs/            # Документация
├── references/      # Медиафайлы и дизайн-референсы
└── prompts/         # Системные промпты для AI
```

## Технологический стек

* React 18
* TypeScript
* Vite
* Telegram Web App SDK v7+

## Документация

Подробная информация по разделам находится в папке [`/docs`](./docs/).
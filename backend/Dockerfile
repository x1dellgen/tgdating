# ─── Stage 1: Builder ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем манифесты зависимостей
COPY package.json package-lock.json ./

# Копируем Prisma-схему до установки зависимостей (для кэширования слоя)
COPY prisma ./prisma

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код и собираем TypeScript
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─── Stage 2: Runner ──────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Копируем манифесты и устанавливаем только production-зависимости
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Копируем сгенерированный Prisma Client и схему
COPY prisma ./prisma
RUN npx prisma generate

# Копируем скомпилированный код из builder-стадии
COPY --from=builder /app/dist ./dist

# Создаём директорию для загрузок
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/server.js"]

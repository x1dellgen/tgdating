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

# Копируем манифесты и устанавливаем production-зависимости (включая prisma CLI + engines)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Копируем сгенерированный Prisma Client из builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Копируем схему и миграции
COPY prisma ./prisma

# Копируем скомпилированный код из builder-стадии
COPY --from=builder /app/dist ./dist

# Копируем entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Создаём директорию для загрузок с правами пользователя node
RUN mkdir -p uploads && chown node:node uploads

# Запускаем от непривилегированного пользователя
USER node

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]

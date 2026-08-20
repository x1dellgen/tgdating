# ─── Stage 1: Builder ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем манифесты зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем конфигурационные файлы и исходный код
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY public ./public
COPY src ./src

# Собираем SPA (VITE_API_URL="" → фронт использует относительные пути для nginx-прокси)
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ─── Stage 2: Runner (Nginx) ──────────────────────────────
FROM nginx:alpine AS runner

# Удаляем дефолтную конфигурацию nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем нашу конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

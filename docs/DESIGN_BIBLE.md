# DESIGN BIBLE — Дизайн-система TMA Dating

## Философия дизайна

Интерфейс следует трём системам:
* **Telegram Design System** — как основа. Цвета темы, шрифты, скругления — всё
  как в нативном Telegram.
* **Apple Human Interface** — обилие воздуха, крупный текст, интуитивная навигация.
* **Material 3** — динамические цвета, elevation-тени, ритмичные анимации.

## Цвета

Приложение использует CSS-переменные Telegram Web App (`var(--tg-theme-*)`),
которые автоматически адаптируются к теме пользователя (Light / Dark).

| Переменная | Назначение |
|---|---|
| `--tg-theme-bg-color` | Основной фон экрана |
| `--tg-theme-text-color` | Основной цвет текста |
| `--tg-theme-hint-color` | Подсказки, второстепенный текст |
| `--tg-theme-link-color` | Акцентный цвет, ссылки |
| `--tg-theme-button-color` | Кнопки (фон) |
| `--tg-theme-button-text-color` | Текст на кнопках |
| `--tg-theme-secondary-bg-color` | Вторичный фон (карточки, блоки) |

*Запрещено использовать жёстко заданные цвета.* Всё только через переменные Telegram.

## Типографика

* Системный шрифт: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`
* Заголовки: `font-weight: 600`, крупный кегль (20–28px)
* Основной текст: `font-weight: 400`, 16–18px
* Подсказки: `font-weight: 400`, 13–14px, уменьшенная непрозрачность
* Межстрочный интервал: 1.4–1.6

## Отступы и размеры

* Максимальная ширина контента: **500px**
* Базовый padding экрана: **24px**
* Отступы между смысловыми блоками: **32–48px**
* Радиус скругления карточек: **16px**
* Радиус скругления кнопок: **12px**
* Минимальная высота кнопок: **52px**

## Элементы

### Кнопки

```css
.primary-button {
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 12px;
  background: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primary-button:active {
  opacity: 0.7;
}
```

### Карточки

```css
.card {
  padding: 24px;
  border-radius: 16px;
  background: var(--tg-theme-secondary-bg-color);
}
```

### Максимальная ширина контейнера

```css
.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

## Адаптивная поддержка тем

Все элементы используют исключительно CSS-переменные Telegram.
Приложение не должно ломаться при переключении темы — цвета меняются мгновенно.

## Запрещено

* Жёстко заданные цвета (кроме как через переменные Telegram)
* Ширина контента > 500px в десктопном режиме
* Мелкий текст (< 13px)
* Скругления < 8px для интерактивных элементов
* Агрессивные анимации и transition > 0.3s
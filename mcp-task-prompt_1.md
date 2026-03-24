# Задание: MCP-сервер для ScreenshotRun Screenshot API

## Контекст

ScreenshotRun (screenshotrun.com) — это Screenshot API. Пользователь отправляет URL, API возвращает скриншот страницы (PNG/JPEG/WebP/PDF). API уже работает и принимает запросы.

Нужно создать MCP-сервер (Model Context Protocol), который позволит AI-агентам (Claude Desktop, Claude Code, Cursor, Windsurf) вызывать ScreenshotRun API как инструмент. Сервер должен публиковаться как npm-пакет.

## Технические требования

### Стек
- TypeScript
- Официальный MCP TypeScript SDK: `@modelcontextprotocol/sdk`
- Транспорт: stdio (для локального запуска через npx) + Streamable HTTP (для remote-подключения без установки)
- Сборка: tsup или tsc
- Публикация: npm

### Структура проекта

```
screenshotrun-mcp/
├── src/
│   ├── index.ts          # Точка входа, инициализация MCP-сервера
│   ├── tools.ts          # Определения инструментов (tools)
│   └── api.ts            # HTTP-клиент для ScreenshotRun API
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE (MIT)
```

### MCP Tools (инструменты, которые видит AI-агент)

#### 1. `take_screenshot`
Основной инструмент. Делает скриншот указанного URL.

Параметры (определить через zod-схему):
- `url` (string, required) — URL страницы для скриншота
- `format` (enum: "png" | "jpeg" | "webp" | "pdf", default: "png") — формат вывода
- `width` (number, default: 1280) — ширина viewport в px (мин 320, макс 3840)
- `height` (number, default: 800) — высота viewport в px (мин 200, макс 10000)
- `full_page` (boolean, default: false) — скриншот всей страницы с прокруткой
- `dark_mode` (boolean, default: false) — режим prefers-color-scheme: dark
- `block_ads` (boolean, default: true) — блокировка рекламы
- `block_cookie_banners` (boolean, default: true) — блокировка cookie-баннеров
- `delay` (number, default: 0) — задержка в мс после загрузки страницы (макс 10000)
- `device` (enum: "desktop" | "iphone_14" | "iphone_15_pro" | "pixel_7" | "ipad_pro", optional) — пресет устройства
- `hide_selectors` (string, optional) — CSS-селекторы для скрытия элементов, через запятую
- `response_type` (enum: "binary" | "json", default: "json") — для MCP всегда json, возвращает base64

Возврат: объект с полями:
- `image_base64` (string) — base64-encoded изображение
- `format` (string) — формат
- `width` (number) — фактическая ширина
- `height` (number) — фактическая высота
- `url` (string) — URL который был заскриншочен
- `cached` (boolean) — из кэша или свежий рендер

#### 2. `check_usage`
Показывает текущее использование API (сколько скриншотов осталось в плане).

Параметры: нет.

Возврат:
- `plan` (string) — название плана
- `screenshots_used` (number)
- `screenshots_limit` (number)
- `period_start` (string, ISO date)
- `period_end` (string, ISO date)

#### 3. `get_page_meta`
Извлекает метаданные страницы без скриншота (title, description, OG-теги).

Параметры:
- `url` (string, required)

Возврат:
- `title` (string)
- `description` (string)
- `og_title` (string)
- `og_description` (string)
- `og_image` (string)
- `favicon` (string)
- `lang` (string)

### API-клиент

ScreenshotRun API endpoint: `https://api.screenshotrun.com/v1/screenshot`

Аутентификация: заголовок `X-API-Key: <ключ>`

API-ключ передаётся через environment variable `SCREENSHOTRUN_API_KEY`.

Пример запроса:
```bash
curl "https://api.screenshotrun.com/v1/screenshot?url=https://example.com&format=png&response_type=json" \
  -H "X-API-Key: sr_live_xxx"
```

### package.json

```json
{
  "name": "screenshotrun-mcp",
  "version": "1.0.0",
  "description": "MCP server for ScreenshotRun Screenshot API — let AI agents capture website screenshots",
  "keywords": ["mcp", "screenshot", "api", "ai-agent", "claude", "cursor", "screenshotrun"],
  "bin": {
    "screenshotrun-mcp": "./dist/index.js"
  },
  "type": "module",
  "files": ["dist"],
  "license": "MIT",
  "author": "ScreenshotRun <support@screenshotrun.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/screenshotrun/screenshotrun-mcp"
  }
}
```

### README.md должен содержать

1. Описание: "Give your AI agent the ability to see any webpage. MCP server for ScreenshotRun Screenshot API."

2. Быстрый старт — конфиг для Claude Desktop:
```json
{
  "mcpServers": {
    "screenshotrun": {
      "command": "npx",
      "args": ["-y", "screenshotrun-mcp"],
      "env": {
        "SCREENSHOTRUN_API_KEY": "sr_live_your_key_here"
      }
    }
  }
}
```

3. Конфиг для Claude Code:
```bash
claude mcp add screenshotrun \
  npx -y screenshotrun-mcp \
  -e SCREENSHOTRUN_API_KEY=sr_live_your_key_here
```

4. Таблица доступных инструментов с описаниями

5. Примеры промптов:
   - "Take a screenshot of https://github.com"
   - "Screenshot example.com in dark mode on iPhone 15 Pro"
   - "Capture full-page screenshot of my website and describe what you see"
   - "Check my ScreenshotRun API usage"

6. Ссылка на получение бесплатного API-ключа: https://screenshotrun.com

7. Бейджи npm version, license

## Важные моменты реализации

1. **Shebang** — первая строка в index.ts: `#!/usr/bin/env node`

2. **Graceful error handling** — если API вернул ошибку, MCP-tool должен вернуть текстовое сообщение об ошибке, а не падать. AI-агент должен понять что пошло не так.

3. **Timeout** — запрос к API с таймаутом 30 секунд. Если страница тяжёлая — показать понятное сообщение.

4. **Валидация URL** — проверить что URL начинается с http:// или https:// перед отправкой в API.

5. **Логирование** — stderr для отладочных логов (stdout зарезервирован для MCP stdio транспорта).

6. **Не хранить API-ключ в коде** — только через env variable.

7. **response_type=json** — для MCP всегда запрашивать JSON-ответ от API, чтобы получить base64 данные и метаданные, а не бинарный файл.

## После реализации

1. Собрать: `npm run build`
2. Протестировать локально: `SCREENSHOTRUN_API_KEY=test npx .`
3. Опубликовать: `npm publish`
4. Зарегистрировать на Smithery (smithery.ai) — для обнаружения через AI-клиенты
5. Добавить в MCP Registry (registry.modelcontextprotocol.io)

## Эталон для изучения

Посмотри как устроен конкурентный MCP-сервер (для понимания структуры, НЕ копировать код):
- https://github.com/User0856/snaprender-integrations — MCP-сервер SnapRender
- https://github.com/mrgoonie/screenshotone-mcp-server — MCP-сервер ScreenshotOne
- https://github.com/modelcontextprotocol/typescript-sdk — официальный SDK

## ВАЖНО

- Подстрой URL эндпоинтов и параметры API под реальный API ScreenshotRun (api.screenshotrun.com). Если реальный API имеет другие параметры — адаптируй tools соответственно.
- Код должен быть production-ready, с правильной типизацией TypeScript.
- Минимум зависимостей: только @modelcontextprotocol/sdk и zod.

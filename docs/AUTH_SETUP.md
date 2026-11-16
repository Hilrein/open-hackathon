# Настройка авторизации (Better Auth)

В проекте для авторизации используется **Better Auth** с базой данных Neon PostgreSQL и Drizzle ORM (включён вход по email и паролю).

## Необходимые переменные окружения

В файле `.env` должны быть заданы:

- `DATABASE_URL` — строка подключения к Neon PostgreSQL.
- `BETTER_AUTH_SECRET` — секретный ключ для подписи сессий и токенов (минимум 32 символа).
- `BETTER_AUTH_URL` — базовый URL приложения (для локальной разработки: `http://localhost:3000`).

### Как сгенерировать `BETTER_AUTH_SECRET`

Выполните в терминале одну из команд и вставьте результат в `.env`:

```bash
openssl rand -base64 32
```

или через Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> **Важно:** никогда не коммитьте файл `.env` в Git и никому не передавайте его содержимое.

## Миграции базы данных

Схема авторизации находится в `src/db/auth-schema.ts` и подключена к `src/db/schema.ts`.

Чтобы сгенерировать и применить миграции:

```bash
npm run db:generate
npm run db:migrate
```

Проверить, что подключение к базе работает и таблица `hackathons` не пострадала:

```bash
npm run db:ping
```

## Текущий этап

На текущем этапе реализован серверный фундамент авторизации (`/api/auth/[...all]`, `authClient`, `getSession` / `getCurrentUser`). Страницы входа и регистрации будут добавлены в следующем таске.

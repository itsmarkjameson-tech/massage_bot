# 🚀 Інструкція з деплою Massage Bot

## Архітектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram      │────▶│   Backend       │────▶│   Supabase      │
│   Mini App      │     │   (Railway)     │     │   (PostgreSQL)  │
│   (Vercel)      │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Redis         │
                        │   (Upstash)     │
                        └─────────────────┘
```

## Покрокова інструкція

### 1. Підготовка репозиторію

```bash
# Клонуйте репозиторій
git clone https://github.com/your-repo/massage-bot.git
cd massage-bot

# Встановіть залежності
pnpm install
```

### 2. Налаштування Supabase (Database)

1. Створіть проект на [supabase.com](https://supabase.com)
2. Отримайте `DATABASE_URL` з налаштувань проекту:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   ```

### 3. Налаштування Redis

**Варіант A: Upstash (рекомендовано)**
1. Створіть проект на [upstash.com](https://upstash.com)
2. Отримайте `REDIS_URL`

**Варіант B: Railway Redis**
1. Створіть проект на [railway.app](https://railway.app)
2. Додайте Redis plugin

### 4. Налаштування Telegram Bot

1. Відкрийте @BotFather в Telegram
2. Створіть нового бота: `/newbot`
3. Отримайте токен бота
4. Налаштуйте Mini App:
   - Відкрийте @BotFather → /mybots → ваш бот → Bot Settings → Menu Button → Configure Menu Button
   - Створіть кнопку з URL вашого Vercel додатку

### 5. Налаштування Vercel (Frontend)

```bash
# Встановіть Vercel CLI
npm i -g vercel

# У директорії web
cd apps/web

# Деплой
vercel --prod
```

Або підключіть GitHub репозиторій до Vercel:
1. Створіть проект на [vercel.com](https://vercel.com)
2. Імпортуйте репозиторій
3. Налаштуйте:
   - Framework Preset: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist`

### 6. Налаштування Railway (Backend)

```bash
# Встановіть Railway CLI
npm i -g @railway/cli

# Логін
railway login

# Створіть проект
railway init

# Додайте змінні середовища
railway variables set DATABASE_URL="..."
railway variables set REDIS_URL="..."
railway variables set BOT_TOKEN="..."
railway variables set WEBAPP_URL="https://your-app.vercel.app"
railway variables set BOT_WEBHOOK_URL="https://your-api.railway.app"
railway variables set JWT_SECRET="your-secret-key-min-32-chars"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://your-app.vercel.app"

# Деплой
railway up
```

### 7. Заповнення бази даних

```bash
# Після деплою, заповніть базу тестовими даними
railway run pnpm db:migrate:prod
railway run pnpm db:seed
```

## Налаштування GitHub Actions CI/CD

### Необхідні secrets

Додайте в GitHub репозиторій → Settings → Secrets:

| Secret | Опис |
|--------|------|
| `VERCEL_TOKEN` | Token з [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID організації Vercel |
| `VERCEL_PROJECT_ID` | ID проекту Vercel |
| `RAILWAY_TOKEN` | Token з railway.app/account/tokens |

### Workflow

CI/CD вже налаштований в `.github/workflows/deploy.yml`:
- Автоматичний деплей на Vercel при пуші в main
- Автоматичний деплей на Railway при пуші в main
- TypeScript перевірка та linting

## Перевірка після деплою

1. **Frontend**: Відкрийте URL Vercel
2. **Backend API**: Перевірте `https://your-api.railway.app/health`
3. **Telegram Bot**: Натисніть /start та перевірте роботу кнопки

## Домен та SSL

### Vercel (Frontend)
1. Налаштуйте домен в Vercel Dashboard
2. SSL налаштується автоматично

### Railway (Backend)
1. Налаштуйте домен в Railway Dashboard
2. SSL налаштується автоматично

## Troubleshooting

### Бот не відповідає
- Перевірте `BOT_WEBHOOK_URL` в Railway
- Перевірте логи: `railway logs`

### Помилки бази даних
- Переконайтесь що `DATABASE_URL` правильний
- Запустіть міграції: `railway run pnpm db:migrate:prod`

### CORS помилки
- Перевірте `CORS_ORIGIN` в Railway змінних
- Має бути повний URL фронтенду

## Корисні команди

```bash
# Логи Railway
railway logs

# Перезапуск
railway restart

# Shell
railway run sh

# Змінні
railway variables
```

# 🚀 Інструкція з деплою Massage Bot

Ти вже переніс код на GitHub та маєш Supabase — це чудово! Ось повна інструкція:

---

## 🏗️ Архітектура проекту

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

---

## 📋 Покроковий план

### Крок 1: Отримай DATABASE_URL з Supabase

1. Зайди в [supabase.com](https://supabase.com) → твій проект
2. **Settings** → **Database**
3. Знайди `Connection string` — це твій `DATABASE_URL`

Формат:
```
postgresql://postgres:[ТВІЙ-ПАРОЛЬ]@db.[ПРОЕКТ].supabase.co:5432/postgres
```

---

### Крок 2: Створи Telegram Bot

1. Відкрий **@BotFather** в Telegram
2. Напиши `/newbot`
3. Дай ім'я боту (наприклад, `Massage Bot`)
4. Отримай `BOT_TOKEN` (виглядає як `1234567890:ABC...`)

---

### Крок 3: Створи Redis (Upstash)

1. Зареєструйся на [upstash.com](https://upstash.com)
2. Створи новий Redis проект
3. Скопіюй `REDIS_URL` (виглядає як `redis://default:...@...upstash.io:6379`)

---

### Крок 4: Задеплой Frontend на Vercel

**Варіант A — через GitHub:**
1. Зайди на [vercel.com](https://vercel.com)
2. Натисни **Add New...** → **Project**
3. Імпортуй свій GitHub репозиторій
4. Налаштування:
   - Framework Preset: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. Натисни **Deploy**

**Збережи URL** (наприклад, `https://massage-bot.vercel.app`)

---

### Крок 5: Задеплой Backend на Railway

1. Зайди на [railway.app](https://railway.app)
2. Створи новий проект (**New** → **Empty Project**)
3. Додай **New** → **GitHub Repo** → обери свій репозиторій
4. Перейди у **Variables** та додай:

| Змінна | Значення |
|--------|---------|
| `DATABASE_URL` | Твій URL з Supabase |
| `REDIS_URL` | Твій URL з Upstash |
| `BOT_TOKEN` | Токен від @BotFather |
| `WEBAPP_URL` | URL з Vercel (https://...) |
| `BOT_WEBHOOK_URL` | URL Railway (отримаєш після деплою) |
| `JWT_SECRET` | Випадковий рядок ≥32 символи |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL з Vercel |
| `PORT` | `3000` |

5. Натисни **Deploy**

**Збережи Railway URL** (наприклад, `https://massage-api.up.railway.app`)

---

### Крок 6: Онови BOT_WEBHOOK_URL

Після деплою на Railway:
1. Зайди в **Railway** → твій проект
2. Скопіюй URL (наприклад, `https://massage-api.up.railway.app`)
3. Додай змінну `BOT_WEBHOOK_URL` = цей URL

---

### Крок 7: Налаштуй Telegram Mini App кнопку

1. Відкрий **@BotFather**
2. `/mybots` → обери свого бота
3. **Bot Settings** → **Menu Button** → **Configure Menu Button**
4. Введи URL: `https://твій-vercel-app.vercel.app`

---

### Крок 8: Запусти міграції та seeds

В Railway терміналі або через `railway run`:

```bash
pnpm db:migrate:prod
pnpm db:seed
```

---

## 🔧 CI/CD з GitHub Actions

Вже налаштовано в [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Потрібно лише додати Secrets:

### Додай в GitHub → Settings → Secrets and variables → Actions:

| Secret | Де взяти |
|--------|----------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Settings → General |
| `RAILWAY_TOKEN` | [railway.app/account/tokens](https://railway.app/account/tokens) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string |

---

## ✅ Після деплою перевір:

1. **Frontend**: відкрий Vercel URL
2. **Backend API**: перейди за адресою `https://твій-railway.app/health`
3. **Telegram**: натисни `/start` у боті — має з'явитися кнопка меню

---

## 🔍 Troubleshooting

### Бот не відповідає
- Перевір `BOT_WEBHOOK_URL` в Railway
- Перевір логи: `railway logs`

### Помилки бази даних
- Переконайся, що `DATABASE_URL` правильний
- Запусти міграції: `railway run pnpm db:migrate:prod`

### CORS помилки
- Перевір `CORS_ORIGIN` в Railway змінних
- Має бути повний URL фронтенду

---

## 📝 Корисні команди

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

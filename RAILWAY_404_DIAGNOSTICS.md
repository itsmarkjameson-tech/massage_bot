# 🔍 Діагностика помилки 404 на Railway

## 📋 Перевірені компоненти

### 1. Структура API роутів на сервері

**Файл:** `apps/server/src/app.ts`

```typescript
// Health check (лінія 70)
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes з префіксом /api (лінії 73-99)
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(usersRoutes, { prefix: '/api/users' });
await app.register(servicesRoutes, { prefix: '/api/services' });
await app.register(mastersRoutes, { prefix: '/api/masters' });
await app.register(bookingsRoutes, { prefix: '/api/bookings' });
await app.register(reviewsRoutes, { prefix: '/api/reviews' });
await app.register(promotionsRoutes, { prefix: '/api/promotions' });
// ... інші роути
```

### 2. API клієнт на фронтенді

**Файл:** `apps/web/src/shared/api/client.ts`

```typescript
// Лінія 56
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Приклад запиту (лінія 82)
const response = await fetch(`${API_BASE}${path}`, {
```

**Як формуються URL:**
- Якщо `VITE_API_URL=https://api.railway.app/api`, а path=`/services`
- Результат: `https://api.railway.app/api/services` ✅

### 3. Запити на HomePage

**Файл:** `apps/web/src/pages/home/HomePage.tsx`

При завантаженні сторінки виконуються:
1. `api.getServices()` → запит на `/services`
2. `api.getMasters()` → запит на `/masters`
3. `api.getPromotions()` → запит на `/promotions`
4. `api.getReviews(6)` → запит на `/reviews`

## ⚠️ ВИЯВЛЕНІ ПРОБЛЕМИ

### Проблема #1: Відсутній root роут `/`

Railway часто робить health check на корінь `/`, але сервер не має такого роута.

**Потрібно додати в `apps/server/src/app.ts`:**
```typescript
// Root health check для Railway
app.get('/', async () => ({ 
    status: 'ok', 
    message: 'Massage Bot API',
    timestamp: new Date().toISOString() 
}));
```

### Проблема #2: Неправильний VITE_API_URL

**❌ Неправильно:**
```
VITE_API_URL=https://your-api.railway.app
```
Результат: `https://your-api.railway.app/services` → 404 ❌

**✅ Правильно:**
```
VITE_API_URL=https://your-api.railway.app/api
```
Результат: `https://your-api.railway.app/api/services` → 200 ✅

## 🔧 ІНСТРУКЦІЯ З ВИПРАВЛЕННЯ

### Крок 1: Виправити сервер (додати root роут)

Додати в `apps/server/src/app.ts` після health check:

```typescript
// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Root endpoint для Railway health check
app.get('/', async () => ({ 
    status: 'ok', 
    message: 'Massage Bot API',
    timestamp: new Date().toISOString() 
}));
```

### Крок 2: Перевірити VITE_API_URL на Vercel

1. Зайдіть в Vercel Dashboard
2. Оберіть ваш проєкт
3. Settings → Environment Variables
4. Перевірте значення `VITE_API_URL`:
   - **МАЄ БУТИ:** `https://your-api.railway.app/api`
   - **З /api в кінці!**

### Крок 3: Перевірити CORS_ORIGIN на Railway

1. Зайдіть в Railway Dashboard
2. Оберіть ваш проєкт
3. Variables
4. Перевірте `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
   Або для доступу з будь-якого джерела:
   ```
   CORS_ORIGIN=*
   ```

### Крок 4: Перезапустити деплой

Після внесення змін:
```bash
# Передеплой сервера
railway up

# Або через Railway Dashboard → Deploy
```

## 🧪 ТЕСТУВАННЯ

### Тест 1: Health Check
```bash
curl https://your-api.railway.app/health
```
Очікувано: `{"status":"ok","timestamp":"..."}`

### Тест 2: Root Endpoint
```bash
curl https://your-api.railway.app/
```
Очікувано: `{"status":"ok","message":"Massage Bot API","timestamp":"..."}`

### Тест 3: API Endpoint
```bash
curl https://your-api.railway.app/api/services
```
Очікувано: JSON зі списком послуг

### Тест 4: CORS
```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-api.railway.app/api/services
```

## 📊 ЧЕКЛІСТ ПЕРЕВІРКИ

- [ ] Сервер має роут `/` (root health check)
- [ ] Сервер має роут `/health`
- [ ] `VITE_API_URL` закінчується на `/api`
- [ ] `CORS_ORIGIN` встановлено правильно
- [ ] Запит `GET /api/services` повертає 200
- [ ] Запит з браузера (Network tab) не має CORS помилок

## 🚨 ЯКЩО ПРОБЛЕМА ЗАЛИШАЄТЬСЯ

1. Відкрийте браузер → DevTools → Network tab
2. Оновіть сторінку
3. Знайдіть запити з помилкою 404
4. Перевірте:
   - **Request URL:** Чи правильний URL?
   - **Status:** 404 чи інша помилка?
   - **Response:** Чи є повідомлення про помилку?
5. Перевірте консоль на CORS помилки
6. Скопіюйте логи з Railway (Logs tab)

## 📞 КОРИСНІ КОМАНДИ

```bash
# Логи Railway
railway logs

# Запуск локально для тестування
cd apps/server && pnpm dev

# Тест API локально
curl http://localhost:3000/health
curl http://localhost:3000/api/services
```

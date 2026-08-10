# Деплой SubSplit на Vercel — пошаговая инструкция

Архитектура: Next.js 14 (App Router) на Vercel + Supabase (PostgreSQL, Auth, RLS) + LemonSqueezy (платежи) + Firebase Cloud Messaging (push).

---

## 1. Env-переменные (все, что нужны)

| Переменная | Где взять | Где используется |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | клиент/сервер |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | клиент/сервер |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (Service role) | кросс-пользовательские операции (уведомления, cron) |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy → Settings → API | создание checkout |
| `LEMONSQUEEZY_STORE_ID` | LemonSqueezy → Settings → Store | checkout |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | LemonSqueezy → Products → Pro → Variants | checkout + проверка плана в вебхуке |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | LemonSqueezy → Settings → Webhooks | подпись вебхуков |
| `NEXT_PUBLIC_APP_URL` | ваш домен, напр. `https://subsplit.app` | redirect после оплаты |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase → Project settings → Web app | клиент FCM |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase → Project settings | клиент + сервер |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase → Project settings | клиент |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase → Project settings | клиент + service worker |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase → Cloud Messaging → Web Push certificates | клиент (получение токена) |
| `GOOGLE_SERVICE_ACCOUNT` | Firebase → Project settings → Service accounts → Generate new private key (JSON целиком) | сервер: отправка push (HTTP v1) |
| `FIREBASE_PROJECT_ID` | тот же, что выше | сервер: отправка push |
| `CRON_SECRET` | сгенерируйте: `openssl rand -hex 32` | защита `/api/cron/daily-reminders` |

> **Важно:** переменные без `NEXT_PUBLIC_` доступны только на сервере. Никогда не кладите `SUPABASE_SERVICE_ROLE_KEY`, `LEMONSQUEEZY_*`, `GOOGLE_SERVICE_ACCOUNT` в клиентский код.

---

## 2. Supabase

1. Создайте проект на [supabase.com](https://supabase.com) (регион — ближе к пользователям).
2. **Схема БД:** откройте **SQL Editor** и выполните по очереди:
   - `supabase/schema.sql` (таблицы, RLS, триггеры, view)
   - `supabase/migrations/001_lemon_squeezy.sql` (колонки плана)
   - `supabase/migrations/002_push_notifications.sql` (push_subscriptions, last_reminded_at)
3. **Auth:**
   - Authentication → Providers → Email: включите (доп. настройте SMTP для писем).
   - Google: создайте OAuth-клиент в Google Cloud Console → укажите `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` в Redirect URIs → вставьте Client ID/Secret в Supabase.
   - Authentication → URL Configuration → Redirect URLs: добавьте `https://YOUR_DOMAIN/**` (и `http://localhost:3000/**` для разработки).
4. RLS уже настроен в schema.sql — ничего включать вручную не нужно (но после деплоя проверьте: каждая таблица в Table Editor должна иметь «Row Level Security: ON»).

---

## 3. LemonSqueezy

1. Зарегистрируйтесь на [lemonsqueezy.com](https://lemonsqueezy.com) → создайте магазин.
2. **Продукт:** Products → New product «SubSplit Pro» → Variant «Pro Monthly», цена **$3.99/мес** (recurring). Скопируйте ID варианта (в URL /products/{id}/variants/{variantId}).
3. **API key:** Settings → API → Generate API key.
4. **Webhook:** Settings → Webhooks → Add webhook:
   - URL: `https://YOUR_DOMAIN/api/billing/webhook`
   - События: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`
   - Скопируйте **Signing secret** → в `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. **Проверка:** на вкладке Webhooks есть «Send test webhook» — в логах Vercel должен появиться ответ `{"received":true}`.

---

## 4. Firebase (push-уведомления)

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project (можно тот же проект, что у GCP, или отдельный).
2. **Web-приложение:** Project settings → Your apps → Add app (Web) → скопируйте `apiKey`, `projectId`, `messagingSenderId`, `appId`.
3. **VAPID key:** Build → Cloud Messaging → Web Push certificates → Generate key pair → скопируйте публичный ключ → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
4. **Service account:** Project settings → Service accounts → Generate new private key → скачайте JSON → вставьте целиком в `GOOGLE_SERVICE_ACCOUNT` (в Vercel можно вставить как multiline).
5. **Проверка:** после деплоя откройте дашборд → кнопка «Push-уведомления» → разрешите → создайте группу → долг должен прийти push'ем и на iOS, и на Android (для iOS Safari требуется push-сертификат Web Push — см. Cloud Messaging → iOS apps).

> Полезно: на вкладке Cloud Messaging есть «Test message» — отправьте на устройство, на котором уже получен токен.

---

## 5. Деплой на Vercel

1. Залейте проект в GitHub (git init, push).
2. [vercel.com](https://vercel.com) → Add New → Project → импортируйте репозиторий. Vercel сам определит **Next.js** фреймворк.
3. **Environment Variables:** добавьте ВСЕ переменные из таблицы п.1 (вкладка Settings → Environment Variables; можно добавить для Production/Preview/Development).
4. Deploy. После сборки проверьте:
   - `https://YOUR_DOMAIN/manifest.webmanifest` — отдаёт манифест;
   - `https://YOUR_DOMAIN/sw.js` — service worker сгенерирован (workbox-* файлы рядом);
   - `/icons/icon-192.png` и `/icons/icon-512.png` — отдаются.
5. **Cron:** `vercel.json` уже содержит расписание `0 8 * * *` (ежедневно 08:00 UTC) для `/api/cron/daily-reminders`. На Hobby-тарифе Vercel разрешены 2 cron-джоба. Cron вызывает роут с заголовком `Authorization: Bearer <CRON_SECRET>`.
   - Проверка: Settings → Cron Jobs → убедитесь, что джоб активен; или вызовите вручную: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/daily-reminders`.

---

## 6. Домен

1. Vercel → Project → Settings → Domains → Add domain (`subsplit.app` и `www.subsplit.app`).
2. У провайдера DNS добавьте:
   - `A @ 76.76.21.21` (или `ALIAS` на `cname.vercel-dns.com`);
   - `CNAME www cname.vercel-dns.com`.
3. Дождитесь применения (Vercel покажет зелёный статус).
4. **Обновите URL-зависимости:**
   - `NEXT_PUBLIC_APP_URL` → `https://subsplit.app`;
   - Supabase → URL Configuration → Redirect URLs → `https://subsplit.app/**`;
   - LemonSqueezy → Settings → Domains → укажите ваш домен (чтобы checkout был на вашем домене);
   - LemonSqueezy webhook URL → `https://subsplit.app/api/billing/webhook`.

---

## 7. Чек-лист после деплоя

- [ ] Регистрация email/Google работает, профиль создаётся автоматически
- [ ] Создание подписки: на Free лимит 3 (4-я показывает upsell-модалку), после оплаты Pro — лимитов нет
- [ ] Лимит группы: Free — 2 человека, Pro — 10
- [ ] LemonSqueezy: оплата → `subscription_created` → тариф сменился на Pro (проверьте вебхук в LS-логах и таблицу users)
- [ ] PWA: на iPhone Safari → Share → «На экран «Домой»; на Android Chrome — баннер установки
- [ ] Push: кнопка «Push-уведомления» → разрешение → push при новом долге (приложение закрыто — системное уведомление, открыто — toast)
- [ ] Cron: дёрните роут вручную с CRON_SECRET — должникам пришли напоминания

## Известные ограничения

- **iOS Safari push** требует отдельной настройки Web Push Certificate в Firebase (платный Apple Developer account).
- `next-pwa` отключён в dev (`disable: process.env.NODE_ENV === "development"`) — PWA и FCM проверяются на production-сборке (`npm run build && npm start`).
- Если иконки не нравятся — перегенерируйте: `node scripts/generate-icons.mjs` (чистый Node, без зависимостей).

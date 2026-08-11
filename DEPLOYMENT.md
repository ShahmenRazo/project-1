# SubSplit — Deployment Checklist

Полный чеклист развёртывания. Всё, кроме раздела «VPS», применимо и к
Vercel-деплою. Звёздочкой `(*)` отмечены шаги с повторными проверками
после деплоя.

## 1. Supabase

- [x] Поднят PostgreSQL + PostgREST + Auth (self-hosted Kong `http://127.0.0.1:8000`).
- [x] Выполнены все миграции `supabase/migrations` (структура: profiles, groups,
      memberships, payments, subscriptions, notifications, referral_codes, error_reports).
- [x] **RLS включена** на всех таблицах; политики проверены:
      - `profiles` — юзер видит только свой профиль;
      - `groups` / `memberships` — только свои группы и членства;
      - `payments` — только свои платежи (payable/receivable);
      - `notifications` — только свои уведомления.
- [x] Auth: email + password, redirect URL приложения настроен.

## 2. Переменные окружения

Скопировать `.env.example` → `.env.local` и заполнить. **Нужно 11 обязательных/ключевых:**

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Публичный URL Supabase (в браузере) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (в браузере) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (только server-side!) |
| `SUPABASE_INTERNAL_URL` | Server-side адрес (self-hosted: `http://127.0.0.1:8000`) |
| `NEXT_PUBLIC_APP_URL` | Абсолютный URL приложения (redirect после оплаты, письма) |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key (checkout) |
| `LEMONSQUEEZY_STORE_ID` | ID магазина LemonSqueezy |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | ID варианта Pro (месяц) |
| `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` | ID варианта Pro (год) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Секрет вебхука (подпись `X-Signature`) |
| `CRON_SECRET` | Секрет для `/api/cron/*` (Bearer) |

Опционально: `RESEND_API_KEY` / `RESEND_FROM` (письма-приглашения),
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (**rate limiting**; без них
лимиты отключены), `NEXT_PUBLIC_GA_ID` (Google Analytics 4), firebase-переменные
(Push-уведомления), `NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC` (Plausible/Umami).

> Замечание: серверные секреты в `process.env` — в runtime `NEXT_PUBLIC_*`
> видны браузеру; service role key и webhook secret никогда не светить.

## 3. Защита API (rate limiting)

- [x] `middleware.ts`: `/api/*` — 30 req/min с IP, `/api/auth/*` — 10 req/min,
      `/api/admin/*` — 60 req/min, `/api/billing/webhook` — без лимита.
- [x] Ответ 429: `{ "error": { "message": "Too many requests", "code": "RATE_LIMITED" } }`
      + заголовок `Retry-After`.
- [ ] **Включить Upstash** (бесплатный тир): `UPSTASH_REDIS_REST_URL` +
      `UPSTASH_REDIS_REST_TOKEN` в `.env.local` → перезапуск сервиса.
- [*] Проверка: `for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/stats; done | sort | uniq -c`
      — ожидается ~30×200 и ~5×429.

## 4. Ошибки и юзер-экспириенс

- [x] `app/error.tsx` + `app/global-error.tsx` используют `ErrorFallback`
      (reload, «Contact support», отправка стека в `/api/report-error`).
- [x] Клиентские ошибки отображаются дружелюбно: 429 → «Too many requests…», 5xx →
      «Something went wrong…» (`lib/client-errors.ts`).
- [*] Проверка: открыть `/`, убить сети/бэкенда — страница показывает карточку
      с кнопками вместо белого экрана.

## 5. OG-изображение

- [x] `GET /api/og` (edge runtime, `@vercel/og`) — 1200×630, градиент,
      шрифты Inter 400/700/900.
- [x] `metadataBase`, `openGraph` и `twitter` карточки в `app/layout.tsx` ссылаются
      на `https://<domain>/api/og`.
- [*] Проверка: `curl -sI https://<domain>/api/og` → `200`, `content-type: image/png`;
      вставить URL в social debugger (og.gg / Twitter Card Validator).

## 6. Домен и favicon

- [x] Домен привязан к хостингу (DNS A/AAAA), HTTPS валиден (Let's Encrypt).
- [x] `favicon.ico` (48px), `apple-touch-icon.png` (180px), иконки в `app/icons/`.
- [*] Проверка: `curl -sI https://<domain>/favicon.ico` → `200`; favicon виден
      во вкладке и на iOS home screen.

## 7. LemonSqueezy webhook

- [ ] В LemonSqueezy (Settings → Webhooks) указать URL:
      `https://<domain>/api/billing/webhook` и подписаться на:
      `subscription_created`, `subscription_updated`, `subscription_cancelled`,
      `subscription_resumed`, `subscription_expired`.
- [ ] `LEMONSQUEEZY_WEBHOOK_SECRET` совпадает с секретом вебхука.
- [*] Проверка: подписка в тестовом режиме → в БД `subscriptions` появляется
      запись, юзеру приходит уведомление.

## 8. Аналитика (GA4)

- [ ] Создать GA4-проект, взять ID вида `G-XXXXXXXXXX` → `NEXT_PUBLIC_GA_ID`.
- [x] `GoogleAnalytics.tsx` — gtag с Consent Mode v2 (default denied; granted
      после «Accept all» в cookie-баннере).
- [x] События: `sign_up` (метод email), `create_group`, `invite_sent`,
      `pro_upgrade` (source: upsell/pricing).
- [*] Проверка: включить GA Debug View (Preview), пройти регистрацию —
      в debug-консоли видны `sign_up` и `create_group`.

## 9. Фоновые задачи (cron)

- [x] `vercel.json` объявляет: `/api/cron/daily-reminders` (08:00) и
      `/api/cron/generate-payments` (09:00), защищены Bearer `CRON_SECRET`.
- [ ] VPS-деплой: создать systemd timer на те же пути с заголовком
      `Authorization: Bearer $CRON_SECRET`, либо вынести cron на Vercel.

## 10. VPS (текущий хостинг)

- [x] Next.js 14.2 (Node 20+) на порту 3000, systemd-юнит `subsplit`, перезапуск
      после `git pull` + `npm run build`.
- [ ] Мониторинг: `journalctl -u subsplit -f`; алерты на 5xx.
- [ ] Бэкап PostgreSQL (pg_dump nightly) — данные пользователей и платежей.

## Финальная проверка

- [ ] `npm run build` и `npx tsc --noEmit` без ошибок.
- [ ] `/` и `/login` открываются, регистрация + логин работают.
- [ ] `https://<domain>/api/og` возвращает PNG 1200×630.
- [ ] 429 срабатывает после 30 запросов к `/api/*` за минуту.
- [ ] Cookie-баннер: «Accept all» включает аналитику (gtag `consent: granted`).

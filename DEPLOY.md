# Инструкция по деплою на Vercel

## Автоматический деплой

Проект уже настроен для автоматического деплоя на Vercel.

### Шаги:

1. **Перейдите на [vercel.com](https://vercel.com)** и войдите через GitHub

2. **Импортируйте проект:**
   - Нажмите "Add New Project"
   - Выберите репозиторий `ViberKoder/mmpad2`
   - Vercel автоматически определит настройки из `vercel.json`

3. **Настройки проекта (опционально):**
   - Framework Preset: Vite (определится автоматически)
   - Build Command: `npm run build` (уже в vercel.json)
   - Output Directory: `dist` (уже в vercel.json)
   - Install Command: `npm install` (уже в vercel.json)

4. **Environment Variables (если нужны):**
   - Если вы используете API ключ для TonAPI, добавьте его как переменную окружения
   - Имя: `VITE_TONAPI_KEY`
   - Значение: ваш API ключ

5. **Деплой:**
   - Нажмите "Deploy"
   - Vercel автоматически соберет и задеплоит проект
   - После деплоя вы получите URL вида: `https://mmpad2.vercel.app`

## Обновление манифеста TonConnect

После получения URL от Vercel, обновите `public/tonconnect-manifest.json`:

```json
{
  "url": "https://ваш-домен.vercel.app",
  "name": "TonFun Launchpad",
  "iconUrl": "https://ваш-домен.vercel.app/vite.svg"
}
```

И сделайте commit + push:

```bash
git add public/tonconnect-manifest.json
git commit -m "Update TonConnect manifest with production URL"
git push
```

Vercel автоматически пересоберет проект после push.

## Ручной деплой через Vercel CLI

Если хотите использовать CLI:

```bash
npm i -g vercel
vercel login
cd tonfun-launchpad
vercel
```

## Проверка деплоя

После деплоя проверьте:
1. ✅ Сайт открывается по URL
2. ✅ Подключение кошелька работает
3. ✅ Список токенов загружается
4. ✅ Создание токена работает (в тестовой сети для начала)

## Важные замечания

- **HTTPS обязателен** для TonConnect (работает только через HTTPS)
- Vercel автоматически предоставляет HTTPS
- После первого деплоя обновите манифест TonConnect с реальным URL
- Для production используйте реальный адрес мастер-контракта в `src/config.ts`

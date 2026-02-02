# Инструкция по настройке

## Важные настройки перед запуском

### 1. Настройка адреса мастер-контракта

Откройте файл `src/config.ts` и замените `MASTER_ADDRESS` на реальный адрес мастер-контракта BCL:

```typescript
MASTER_ADDRESS: "EQD4FPq-PRDieyQKkO5Fm8Tnsg6p4qN1kP5J5N5J5N5J5N5J5N", // Замените на реальный адрес
```

### 2. Настройка API endpoints

Если у вас есть собственные endpoints, обновите их в `src/config.ts`:

```typescript
BCL_API_ENDPOINT: "https://api.ton.fun", // Endpoint для BCL API
TONAPI_ENDPOINT: "https://tonapi.io",    // Endpoint для TonAPI
```

### 3. Настройка TonConnect манифеста

Обновите `public/tonconnect-manifest.json` с реальными данными вашего приложения:

```json
{
  "url": "https://your-domain.com",
  "name": "TonFun Launchpad",
  "iconUrl": "https://your-domain.com/icon.png"
}
```

### 4. Опционально: API ключ для TonAPI

Если у вас есть API ключ для TonAPI, раскомментируйте и добавьте его в `src/contexts/SDKContext.tsx`:

```typescript
const api = new Api({
  baseUrl: TONFUN_CONFIG.TONAPI_ENDPOINT,
  getApiKey: () => 'your-api-key-here'
});
```

## Запуск приложения

1. Установите зависимости:
```bash
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

3. Откройте браузер по адресу `http://localhost:5173`

## Тестирование

1. Подключите кошелек TON через кнопку "Connect Wallet"
2. Создайте тестовый токен на странице "Create New Token"
3. Попробуйте купить/продать токены на странице деталей токена

## Важные замечания

- Убедитесь, что используете тестовую сеть TON для тестирования
- Для работы в mainnet нужны реальные адреса контрактов
- Все транзакции требуют оплаты комиссий в TON

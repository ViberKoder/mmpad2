import { Address } from "@ton/core";

// Конфигурация для TonFun
export const TONFUN_CONFIG = {
  // API endpoint для BCL клиента
  // Используем прокси через Vercel для обхода CORS
  BCL_API_ENDPOINT: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/tonfun`
    : "https://api.ton.fun",
  
  // Адрес мастер-контракта BCL (Mainnet)
  // Это адрес контракта, который управляет созданием токенов
  // ВАЖНО: Это должен быть мастер-контракт (factory) с методом get_factory_data, а не сам BCL контракт
  // Используем формат 0:hash для совместимости с TonAPI
  MASTER_ADDRESS: "0:f3d795d30806c4b2149d895f084c95e01ab6162a33e51083d556034fb5c18263", // Новый мастер-контракт с параметрами: 300 TON, ваш fee_address
  
  // TonAPI endpoint
  TONAPI_ENDPOINT: "https://tonapi.io",
  
  // TonConnect манифест
  TONCONNECT_MANIFEST_URL: "https://mmpad2.vercel.app/tonconnect-manifest.json",
};

// Вспомогательная функция для парсинга адреса
export function parseAddress(address: string): Address {
  try {
    return Address.parse(address);
  } catch (e) {
    throw new Error(`Invalid address: ${address}`);
  }
}

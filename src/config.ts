import { Address } from "@ton/core";

// Конфигурация для TonFun
export const TONFUN_CONFIG = {
  // API endpoint для BCL клиента
  BCL_API_ENDPOINT: "https://api.ton.fun",
  
  // Адрес мастер-контракта BCL (нужно заменить на реальный)
  // Это адрес контракта, который управляет созданием токенов
  MASTER_ADDRESS: "EQD4FPq-PRDieyQKkO5Fm8Tnsg6p4qN1kP5J5N5J5N5J5N5J5N",
  
  // TonAPI endpoint
  TONAPI_ENDPOINT: "https://tonapi.io",
  
  // TonConnect манифест
  TONCONNECT_MANIFEST_URL: (typeof window !== 'undefined' ? window.location.origin : 'https://mmpad2.vercel.app') + "/tonconnect-manifest.json",
};

// Вспомогательная функция для парсинга адреса
export function parseAddress(address: string): Address {
  try {
    return Address.parse(address);
  } catch (e) {
    throw new Error(`Invalid address: ${address}`);
  }
}

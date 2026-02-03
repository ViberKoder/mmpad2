import { Address } from "@ton/core";

// Конфигурация для TonFun
export const TONFUN_CONFIG = {
  // API endpoint для BCL клиента
  BCL_API_ENDPOINT: "https://api.ton.fun",
  
  // Адрес мастер-контракта BCL (Mainnet)
  // Это адрес контракта, который управляет созданием токенов
  MASTER_ADDRESS: "UQCYEPeADv6F9S9orOHA1OX7y0z4D-b43cEZ-71aN2EB3Am3", // Ваш кастомный контракт с fullPriceTon=300 TON
  
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

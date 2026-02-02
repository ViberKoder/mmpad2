import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Api } from 'tonapi-sdk-js';
import { Address } from '@ton/core';
import { BclSDK } from 'ton-bcl-sdk';
import { simpleTonapiProvider } from 'ton-bcl-sdk';
import { TONFUN_CONFIG } from '../config';

interface SDKContextType {
  sdk: BclSDK | null;
  tonapi: Api<any> | null;
  loading: boolean;
}

const SDKContext = createContext<SDKContextType | null>(null);

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  const { sdk, tonapi } = useMemo(() => {
    try {
      // Инициализация TonAPI
      // TonAPI SDK требует HttpClient, но мы можем использовать простую инициализацию
      // Для production добавьте API ключ через переменные окружения
      const api = new Api({
        baseUrl: TONFUN_CONFIG.TONAPI_ENDPOINT,
      } as any);

      // Создание провайдера
      const provider = simpleTonapiProvider(api);

      // Создание SDK
      const bclSDK = BclSDK.create({
        apiProvider: provider,
        clientOptions: {
          endpoint: TONFUN_CONFIG.BCL_API_ENDPOINT,
        },
        masterAddress: Address.parse(TONFUN_CONFIG.MASTER_ADDRESS),
      });

      return { sdk: bclSDK, tonapi: api };
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      return { sdk: null, tonapi: null };
    }
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <SDKContext.Provider value={{ sdk, tonapi, loading }}>
      {children}
    </SDKContext.Provider>
  );
}

export function useSDK() {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Api, HttpClient } from 'tonapi-sdk-js';
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
  const [sdk, setSdk] = useState<BclSDK | null>(null);
  const [tonapi, setTonapi] = useState<Api<any> | null>(null);

  useEffect(() => {
    try {
      // Инициализация TonAPI с HttpClient
      const httpClient = new HttpClient({
        baseUrl: TONFUN_CONFIG.TONAPI_ENDPOINT,
        // Если нужен API ключ, добавьте его здесь:
        // baseApiParams: {
        //   headers: {
        //     Authorization: `Bearer ${process.env.VITE_TONAPI_KEY}`
        //   }
        // }
      });
      
      const api = new Api(httpClient);

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

      setSdk(bclSDK);
      setTonapi(api);
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setSdk(null);
      setTonapi(null);
    } finally {
      setLoading(false);
    }
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

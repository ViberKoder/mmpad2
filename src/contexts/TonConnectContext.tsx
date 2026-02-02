import React, { createContext, useContext, useEffect, useState } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { TONFUN_CONFIG } from '../config';

interface TonConnectContextType {
  connected: boolean;
  address: string | null;
  disconnect: () => void;
}

const TonConnectContext = createContext<TonConnectContextType | null>(null);

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={TONFUN_CONFIG.TONCONNECT_MANIFEST_URL}>
      <TonConnectInnerProvider>{children}</TonConnectInnerProvider>
    </TonConnectUIProvider>
  );
}

function TonConnectInnerProvider({ children }: { children: React.ReactNode }) {
  const [tonConnectUI] = useTonConnectUI();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (tonConnectUI) {
      const account = tonConnectUI.account;
      setConnected(!!account);
      setAddress(account?.address || null);

      const unsubscribe = tonConnectUI.onStatusChange((wallet: any) => {
        setConnected(!!wallet);
        setAddress(wallet?.account?.address || null);
      });

      return () => unsubscribe();
    }
  }, [tonConnectUI]);

  const disconnect = () => {
    tonConnectUI?.disconnect();
  };

  return (
    <TonConnectContext.Provider value={{ connected, address, disconnect }}>
      {children}
    </TonConnectContext.Provider>
  );
}

export function useTonConnect() {
  const context = useContext(TonConnectContext);
  if (!context) {
    throw new Error('useTonConnect must be used within TonConnectProvider');
  }
  return context;
}

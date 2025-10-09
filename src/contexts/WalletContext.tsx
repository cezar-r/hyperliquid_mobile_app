import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as hl from '@nktkas/hyperliquid';
import {
  generateSessionKey,
  saveSessionKey,
  loadSessionKey,
  clearSessionKey,
  createSessionAccount,
} from '../lib/sessionKey';
import type { SessionKey } from '../lib/sessionKey';
import { createHttpTransport, createExchangeClient } from '../lib/hyperliquid';

const WALLET_DISCONNECTED_KEY = 'hl_wallet_disconnected';

interface WalletContextValue {
  mainExchangeClient: hl.ExchangeClient | null;
  exchangeClient: hl.ExchangeClient | null;
  sessionKey: SessionKey | null;
  setupClients: (
    address: string,
    provider: any,
    existingSessionKey?: SessionKey | null
  ) => Promise<void>;
  clearClients: () => void;
  enableSessionKey: (address: string) => Promise<void>;
  disableSessionKey: () => Promise<void>;
  hasSessionKey: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [mainExchangeClient, setMainExchangeClient] =
    useState<hl.ExchangeClient | null>(null);
  const [exchangeClient, setExchangeClient] =
    useState<hl.ExchangeClient | null>(null);
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);

  const setupClients = useCallback(
    async (
      address: string,
      provider: any,
      existingSessionKey?: SessionKey | null
    ) => {
      const transport = createHttpTransport();
      const mainClient = createExchangeClient(provider, transport);
      setMainExchangeClient(mainClient);

      if (existingSessionKey) {
        console.log('[WalletContext] Using existing session key');
        const sessionAccount = createSessionAccount(
          existingSessionKey.privateKey
        );
        const sessionWalletClient = {
          account: sessionAccount,
          signTypedData: sessionAccount.signTypedData.bind(sessionAccount),
        } as any;
        const sessionExchangeClient = createExchangeClient(
          sessionWalletClient,
          transport
        );
        setExchangeClient(sessionExchangeClient);
        setSessionKey(existingSessionKey);
      } else {
        setExchangeClient(mainClient);
      }

      await AsyncStorage.removeItem(WALLET_DISCONNECTED_KEY);
      console.log('[WalletContext] Clients set up for:', address);
    },
    []
  );

  const clearClients = useCallback(() => {
    setMainExchangeClient(null);
    setExchangeClient(null);
    setSessionKey(null);
  }, []);

  const enableSessionKey = useCallback(async (address: string): Promise<void> => {
    if (!mainExchangeClient) {
      throw new Error('No wallet connected');
    }

    try {
      console.log('[SessionKey] Enabling session key...');

      const newSessionKey = generateSessionKey();

      const result = await mainExchangeClient.approveAgent({
        agentAddress: newSessionKey.address as `0x${string}`,
        agentName: 'MobileAutoApp',
      });

      console.log('[SessionKey] Agent approved:', result);

      await saveSessionKey(newSessionKey);

      const sessionAccount = createSessionAccount(newSessionKey.privateKey);
      const sessionWalletClient = {
        account: sessionAccount,
        signTypedData: sessionAccount.signTypedData.bind(sessionAccount),
      } as any;

      const transport = createHttpTransport();
      const sessionExchangeClient = createExchangeClient(
        sessionWalletClient,
        transport
      );

      setExchangeClient(sessionExchangeClient);
      setSessionKey(newSessionKey);

      console.log('[SessionKey] Session key enabled successfully');
    } catch (error) {
      console.error('[SessionKey] Failed to enable session key:', error);
      throw error;
    }
  }, [mainExchangeClient]);

  const disableSessionKey = useCallback(async (): Promise<void> => {
    try {
      console.log('[SessionKey] Disabling session key...');

      await clearSessionKey();

      setExchangeClient(mainExchangeClient);
      setSessionKey(null);

      console.log('[SessionKey] Session key disabled successfully');
    } catch (error) {
      console.error('[SessionKey] Failed to disable session key:', error);
      throw error;
    }
  }, [mainExchangeClient]);

  const value: WalletContextValue = {
    mainExchangeClient,
    exchangeClient,
    sessionKey,
    setupClients,
    clearClients,
    enableSessionKey,
    disableSessionKey,
    hasSessionKey: sessionKey !== null,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

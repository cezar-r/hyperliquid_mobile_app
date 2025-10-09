import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
import {
  createHttpTransport,
  createExchangeClient,
  createInfoClient,
} from '../lib/hyperliquid';
import type { AccountData, AccountState } from '../types';

const WALLET_DISCONNECTED_KEY = 'hl_wallet_disconnected';

interface WalletContextValue {
  infoClient: hl.InfoClient | null;
  mainExchangeClient: hl.ExchangeClient | null;
  exchangeClient: hl.ExchangeClient | null;
  sessionKey: SessionKey | null;
  account: AccountState;
  setupClients: (
    address: string,
    provider: any,
    existingSessionKey?: SessionKey | null
  ) => Promise<void>;
  clearClients: () => void;
  enableSessionKey: (address: string) => Promise<void>;
  disableSessionKey: () => Promise<void>;
  refetchAccount: () => Promise<void>;
  hasSessionKey: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [infoClient, setInfoClient] = useState<hl.InfoClient | null>(null);
  const [mainExchangeClient, setMainExchangeClient] =
    useState<hl.ExchangeClient | null>(null);
  const [exchangeClient, setExchangeClient] =
    useState<hl.ExchangeClient | null>(null);
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [connectedAddress, setConnectedAddress] =
    useState<string | null>(null);
  const [account, setAccount] = useState<AccountState>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const transport = createHttpTransport();
    const client = createInfoClient(transport);
    setInfoClient(client);
    console.log('[Phase 3] InfoClient initialized');
  }, []);

  const fetchAccountData = useCallback(
    async (userAddress: string) => {
      if (!infoClient) {
        console.error('[Phase 3] InfoClient not initialized');
        return;
      }

      console.log('[Phase 3] Fetching account data for:', userAddress);
      setAccount((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const [perpState, spotState, openOrders, userFills] =
          await Promise.all([
            infoClient
              .clearinghouseState({ user: userAddress as `0x${string}` })
              .catch((err) => {
                console.warn('[Phase 3] clearinghouseState error:', err);
                return null;
              }),
            infoClient
              .spotClearinghouseState({ user: userAddress as `0x${string}` })
              .catch((err) => {
                console.warn('[Phase 3] spotClearinghouseState error:', err);
                return null;
              }),
            infoClient
              .frontendOpenOrders({ user: userAddress as `0x${string}` })
              .catch((err) => {
                console.warn('[Phase 3] frontendOpenOrders error:', err);
                return [];
              }),
            infoClient
              .userFills({ user: userAddress as `0x${string}` })
              .catch((err) => {
                console.warn('[Phase 3] userFills error:', err);
                return [];
              }),
          ]);

        console.log('[Phase 3] Perp state:', perpState);
        console.log('[Phase 3] Spot state:', spotState);
        console.log('[Phase 3] Open orders:', openOrders);
        console.log('[Phase 3] User fills count:', userFills?.length || 0);
        console.log('[Phase 3] User fills:', userFills);

        const accountData: AccountData = {
          perpPositions: perpState?.assetPositions || [],
          perpMarginSummary: {
            accountValue: perpState?.marginSummary?.accountValue,
            totalMarginUsed: perpState?.marginSummary?.totalMarginUsed,
            totalNtlPos: perpState?.marginSummary?.totalNtlPos,
            totalRawUsd: perpState?.marginSummary?.totalRawUsd,
            withdrawable: perpState?.withdrawable,
          },
          spotBalances: spotState?.balances || [],
          openOrders: openOrders || [],
          userFills: userFills || [],
        };

        setAccount({
          data: accountData,
          isLoading: false,
          error: null,
        });

        console.log('[Phase 3] ✓ Account data fetched successfully');
      } catch (error: any) {
        console.error('[Phase 3] Failed to fetch account data:', error);
        setAccount({
          data: null,
          isLoading: false,
          error: error.message || 'Failed to fetch account data',
        });
      }
    },
    [infoClient]
  );

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

      setConnectedAddress(address);
      await AsyncStorage.removeItem(WALLET_DISCONNECTED_KEY);
      console.log('[WalletContext] Clients set up for:', address);

      await fetchAccountData(address);
    },
    [fetchAccountData]
  );

  const clearClients = useCallback(() => {
    setMainExchangeClient(null);
    setExchangeClient(null);
    setSessionKey(null);
    setConnectedAddress(null);
    setAccount({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refetchAccount = useCallback(async () => {
    if (connectedAddress) {
      await fetchAccountData(connectedAddress);
    }
  }, [connectedAddress, fetchAccountData]);

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
    infoClient,
    mainExchangeClient,
    exchangeClient,
    sessionKey,
    account,
    setupClients,
    clearClients,
    enableSessionKey,
    disableSessionKey,
    refetchAccount,
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

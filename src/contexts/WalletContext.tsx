import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
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
  enableHip3DexAbstraction,
} from '../lib/hyperliquid';
import { isTestnet } from '../lib/config';
import type { AccountData, AccountState } from '../types';
import { createWalletClient, custom } from 'viem';
import {
  logApiCall,
  logApiResponse,
  logApiError,
  logPollingStart,
  logPollingStop,
  logPollingCycle,
  logDataUpdate,
} from '../lib/logger';
import { withRetry } from '../lib/retry';
import { isRetryableError } from '../lib/apiErrors';
import { HIP3_DEXES } from '../constants/constants';
import { useAppVisibility } from '../hooks';

const WALLET_DISCONNECTED_KEY = 'hl_wallet_disconnected';

// Helper to compare account data - avoids unnecessary re-renders when polling
// returns fresh data identical to current data
const isAccountDataEqual = (prev: AccountData | null, next: AccountData | null): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return false;
  // Compare key fields that affect rendering
  // Using JSON.stringify for deep comparison (acceptable for polling data size)
  return JSON.stringify(prev) === JSON.stringify(next);
};

interface WalletContextValue {
  infoClient: hl.InfoClient;
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
  pausePolling: () => void;
  resumePolling: () => void;
  getExchangeClientForDex: (dex: string) => hl.ExchangeClient | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [infoClient] = useState<hl.InfoClient>(() => {
    const transport = createHttpTransport();
    const client = createInfoClient(transport);
    console.log('[Phase 3] InfoClient initialized');
    return client;
  });
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

  // Cache for dex-specific exchange clients (HIP-3)
  const dexClientsRef = useRef<Record<string, hl.ExchangeClient>>({});

  const fetchAccountData = useCallback(
    async (userAddress: string, silent: boolean = false) => {
      if (!infoClient) {
        console.warn('[Phase 3] InfoClient not initialized (defensive check)');
        return;
      }

      if (!silent) {
        logApiCall('fetchAccountData', `user: ${userAddress}`);
        setAccount((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        // Only log API calls on non-silent fetches to reduce log spam
        if (!silent) {
          logApiCall('clearinghouseState', `user: ${userAddress}`);
          logApiCall('spotClearinghouseState', `user: ${userAddress}`);
          logApiCall('frontendOpenOrders', `user: ${userAddress}`);
          logApiCall('userFills', `user: ${userAddress}`);
          logApiCall('userFunding', `user: ${userAddress}`);
          logApiCall('delegations', `user: ${userAddress}`);
          logApiCall('delegatorSummary', `user: ${userAddress}`);
          logApiCall('delegatorRewards', `user: ${userAddress}`);
        }

        // Lazy load HIP-3 dexes: on silent fetches, only fetch from dexes with known positions/orders
        const hip3DexesToFetch = silent ? activeHip3DexesRef.current : HIP3_DEXES;

        // Fetch default perp state and HIP-3 dex states
        const perpStatePromises = [
          withRetry(
            () => infoClient.clearinghouseState({ user: userAddress as `0x${string}` }),
            { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
          )
            .then(state => ({ state, dex: '' }))
            .catch((err) => {
              if (!silent) logApiError('clearinghouseState (default)', err);
              return { state: null, dex: '' };
            }),
          ...hip3DexesToFetch.map(dex =>
            withRetry(
              () => infoClient.clearinghouseState({ user: userAddress as `0x${string}`, dex }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            )
              .then(state => ({ state, dex }))
              .catch((err) => {
                if (!silent) console.error(`[HIP-3] Failed to fetch clearinghouseState for ${dex}:`, err);
                return { state: null, dex };
              })
          )
        ];

        // Fetch default orders and HIP-3 dex orders
        const openOrdersPromises = [
          withRetry(
            () => infoClient.frontendOpenOrders({ user: userAddress as `0x${string}` }),
            { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
          )
            .then(orders => ({ orders, dex: '' }))
            .catch((err) => {
              if (!silent) logApiError('frontendOpenOrders (default)', err);
              return { orders: [], dex: '' };
            }),
          ...hip3DexesToFetch.map(dex =>
            withRetry(
              () => infoClient.frontendOpenOrders({ user: userAddress as `0x${string}`, dex }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            )
              .then(orders => ({ orders, dex }))
              .catch((err) => {
                if (!silent) console.error(`[HIP-3] Failed to fetch frontendOpenOrders for ${dex}:`, err);
                return { orders: [], dex };
              })
          )
        ];

        const [perpStatesResults, spotState, openOrdersResults, userFills, userFundings, stakingDelegations, stakingSummary, stakingRewards] =
          await Promise.all([
            Promise.all(perpStatePromises),
            withRetry(
              () => infoClient.spotClearinghouseState({ user: userAddress as `0x${string}` }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('spotClearinghouseState', err);
              return null;
            }),
            Promise.all(openOrdersPromises),
            withRetry(
              () => infoClient.userFills({ user: userAddress as `0x${string}` }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('userFills', err);
              return [];
            }),
            withRetry(
              () => infoClient.userFunding({
                user: userAddress as `0x${string}`,
                startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
              }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('userFunding', err);
              return [];
            }),
            withRetry(
              () => infoClient.delegations({ user: userAddress as `0x${string}` }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('delegations', err);
              return [];
            }),
            withRetry(
              () => infoClient.delegatorSummary({ user: userAddress as `0x${string}` }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('delegatorSummary', err);
              return null;
            }),
            withRetry(
              () => infoClient.delegatorRewards({ user: userAddress as `0x${string}` }),
              { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isRetryableError }
            ).catch((err) => {
              if (!silent) logApiError('delegatorRewards', err);
              return [];
            }),
          ]);

        // Combine all perp positions from all dexes
        let allPerpPositions: any[] = [];
        perpStatesResults.forEach(({ state, dex }) => {
          if (state?.assetPositions) {
            const dexPositions = state.assetPositions.map((item: any) => ({ ...item, dex }));
            allPerpPositions.push(...dexPositions);
            if (!silent && dex) {
              console.log(`[HIP-3] ${dex} positions:`, JSON.stringify(dexPositions, null, 2));
              console.log(`[HIP-3] ${dex} margin summary:`, JSON.stringify(state.marginSummary, null, 2));
            }
          }
        });

        // Combine all orders from all dexes
        let allOpenOrders: any[] = [];
        openOrdersResults.forEach(({ orders, dex }) => {
          if (orders && orders.length > 0) {
            const dexOrders = orders.map((order: any) => {
              let coin = order.coin;
              // Strip dex prefix if present (API returns "xyz:NVDA" format for HIP-3)
              if (dex && coin.startsWith(`${dex}:`)) {
                coin = coin.slice(dex.length + 1);
              }
              return { ...order, coin, dex };
            });
            allOpenOrders.push(...dexOrders);
            if (!silent && dex) {
              console.log(`[HIP-3] ${dex} orders:`, JSON.stringify(dexOrders, null, 2));
            }
          }
        });

        // Update active HIP-3 dexes for lazy loading optimization
        // Only dexes with positions or orders need to be polled during silent fetches
        if (!silent) {
          const dexesWithData = new Set<string>();
          perpStatesResults.forEach(({ state, dex }) => {
            if (dex && state?.assetPositions && state.assetPositions.length > 0) {
              dexesWithData.add(dex);
            }
          });
          openOrdersResults.forEach(({ orders, dex }) => {
            if (dex && orders && orders.length > 0) {
              dexesWithData.add(dex);
            }
          });
          activeHip3DexesRef.current = Array.from(dexesWithData);
        }

        // Get the default perp state for margin summary
        const defaultPerpState = perpStatesResults.find(r => r.dex === '')?.state;

        // Aggregate margin summary from all dexes (default + HIP-3)
        let totalAccountValue = 0;
        let totalMarginUsed = 0;
        let totalNtlPos = 0;
        let totalRawUsd = 0;

        perpStatesResults.forEach(({ state }) => {
          if (state?.marginSummary) {
            totalAccountValue += parseFloat(state.marginSummary.accountValue || '0');
            totalMarginUsed += parseFloat(state.marginSummary.totalMarginUsed || '0');
            totalNtlPos += parseFloat(state.marginSummary.totalNtlPos || '0');
            totalRawUsd += parseFloat(state.marginSummary.totalRawUsd || '0');
          }
        });

        if (!silent) {
          logApiResponse('clearinghouseState', allPerpPositions.length, 'total positions (all dexes)');
          logApiResponse('spotClearinghouseState', spotState?.balances?.length || 0, 'balances');
          logApiResponse('frontendOpenOrders', allOpenOrders.length, 'total orders (all dexes)');
          logApiResponse('userFills', userFills?.length || 0, 'fills');
          logApiResponse('userFunding', userFundings?.length || 0, 'fundings');
          logApiResponse('delegations', stakingDelegations?.length || 0, 'delegations');
          logApiResponse('delegatorSummary', stakingSummary ? 1 : 0);
          logApiResponse('delegatorRewards', stakingRewards?.length || 0, 'rewards');
        }

        // Map perpPositions from API response structure
        const perpPositions = allPerpPositions.map((item: any) => {
          // API returns { type: "oneWay", position: {...} }
          const pos = item.position || item;
          const dex = item.dex || '';

          // HIP-3 API returns coin with dex prefix (e.g., 'xyz:NVDA')
          // Strip the prefix since we track dex separately
          const coinParts = pos.coin.split(':');
          const coinSymbol = coinParts.length > 1 ? coinParts[1] : pos.coin;

          // Find TP/SL orders for this position (matching both coin and dex)
          const tpslOrders = allOpenOrders.filter((order: any) =>
            order.coin === coinSymbol &&
            order.dex === dex &&
            (order.orderType?.includes('Take Profit') || order.orderType?.includes('Stop'))
          );

          const tpOrder = tpslOrders.find((o: any) =>
            o.orderType?.includes('Take Profit')
          );
          const slOrder = tpslOrders.find((o: any) =>
            o.orderType?.includes('Stop')
          );

          const tpPrice = tpOrder?.triggerPx ? parseFloat(tpOrder.triggerPx) : null;
          const slPrice = slOrder?.triggerPx ? parseFloat(slOrder.triggerPx) : null;

          return {
            coin: coinSymbol,
            szi: pos.szi,
            entryPx: pos.entryPx,
            positionValue: pos.positionValue,
            unrealizedPnl: pos.unrealizedPnl,
            returnOnEquity: pos.returnOnEquity,
            leverage: pos.leverage,
            liquidationPx: pos.liquidationPx,
            marginUsed: pos.marginUsed,
            tpPrice,
            slPrice,
            tpOrderId: tpOrder?.oid || null,
            slOrderId: slOrder?.oid || null,
            dex, // Add dex field to track which dex this position belongs to
          };
        });

        // Map userFundings from API response structure
        // API returns array of { time, hash, delta: { type: "funding", coin, usdc, szi, fundingRate } }
        const mappedUserFundings = (userFundings || [])
          .filter((item: any) => item.delta?.type === 'funding')
          .map((item: any) => ({
            time: item.time,
            coin: item.delta.coin,
            usdc: item.delta.usdc,
            szi: item.delta.szi,
            fundingRate: item.delta.fundingRate,
          }));

        // Map userFills - parse coin to extract dex for HIP-3 fills
        // API returns coin with dex prefix for HIP-3 (e.g., 'vntl:SPACEX')
        const mappedUserFills = (userFills || []).map((fill: any) => {
          const coinParts = fill.coin.split(':');
          const coinSymbol = coinParts.length > 1 ? coinParts[1] : fill.coin;
          const dex = coinParts.length > 1 ? coinParts[0] : '';

          return {
            ...fill,
            coin: coinSymbol,
            dex,
          };
        });

        const accountData: AccountData = {
          perpPositions,
          perpMarginSummary: {
            accountValue: totalAccountValue.toString(),
            totalMarginUsed: totalMarginUsed.toString(),
            totalNtlPos: totalNtlPos.toString(),
            totalRawUsd: totalRawUsd.toString(),
            withdrawable: defaultPerpState?.withdrawable,  // Keep from default only
          },
          spotBalances: spotState?.balances || [],
          openOrders: allOpenOrders, // Use combined orders from all dexes
          userFills: mappedUserFills,
          userFundings: mappedUserFundings,
          stakingDelegations: stakingDelegations || [],
          stakingSummary: stakingSummary || null,
          stakingRewards: stakingRewards || [],
          lastUpdated: Date.now(),
        };

        // Only update state if data actually changed (prevents unnecessary re-renders)
        setAccount((prev) => {
          if (isAccountDataEqual(prev.data, accountData)) {
            // Data unchanged - just update lastUpdated if needed, but keep same reference
            return prev;
          }
          return {
            data: accountData,
            isLoading: false,
            error: null,
          };
        });

        if (!silent) {
          console.log('[Phase 3] ✓ Account data fetched successfully');
        }
      } catch (error: any) {
        if (!silent) {
          console.error('[Phase 3] Failed to fetch account data:', error);
        }
        // On silent refresh errors, don't update the error state - keep existing data
        if (!silent) {
          setAccount({
            data: null,
            isLoading: false,
            error: error.message || 'Failed to fetch account data',
          });
        }
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
      // Wrap the provider with a viem WalletClient to ensure typed data signing support
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        transport: custom(provider as any),
      } as any);
      const mainClient = createExchangeClient(walletClient as any, transport);
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

      // Enable HIP-3 DEX abstraction for trading on builder dexes
      try {
        // Use the main client for enabling (session key may not be set up yet)
        await enableHip3DexAbstraction(mainClient, address, true);
      } catch (error) {
        console.warn('[WalletContext] Could not enable HIP-3 DEX abstraction:', error);
        // Continue even if this fails - user can still trade on default dex
      }

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
    // Clear cached dex clients
    dexClientsRef.current = {};
  }, []);

  const refetchAccount = useCallback(async () => {
    if (connectedAddress) {
      await fetchAccountData(connectedAddress);
    }
  }, [connectedAddress, fetchAccountData]);

  // App visibility state - used to pause polling when app is backgrounded
  const isAppActive = useAppVisibility();

  // Screen-based polling pause control (for when user is on ChartScreen, etc.)
  const isPollingPausedRef = useRef(false);

  // Track which HIP-3 dexes have positions/orders - lazy load only active dexes during silent polling
  const activeHip3DexesRef = useRef<string[]>([...HIP3_DEXES]);

  const pausePolling = useCallback(() => {
    if (!isPollingPausedRef.current) {
      isPollingPausedRef.current = true;
      console.log('[WalletContext] Polling paused (screen-based)');
    }
  }, []);

  const resumePolling = useCallback(() => {
    if (isPollingPausedRef.current) {
      isPollingPausedRef.current = false;
      console.log('[WalletContext] Polling resumed');
    }
  }, []);

  // Auto-refresh account data every 10 seconds when connected AND app is active
  useEffect(() => {
    // Don't poll if not connected or app is in background
    if (!connectedAddress || !isAppActive) {
      if (!isAppActive && connectedAddress) {
        console.log('[WalletContext] Pausing polling - app in background');
      }
      return;
    }

    logPollingStart('WalletContext', 10000);

    const intervalId = setInterval(() => {
      // Skip if paused by screen (e.g., ChartScreen active)
      if (isPollingPausedRef.current) {
        return;
      }
      logPollingCycle('WalletContext');
      fetchAccountData(connectedAddress, true); // silent refresh
    }, 10000);

    return () => {
      logPollingStop('WalletContext');
      clearInterval(intervalId);
    };
  }, [connectedAddress, fetchAccountData, isAppActive]);

  const enableDexAbstraction = useCallback(async (address: string): Promise<void> => {
    if (!mainExchangeClient) {
      throw new Error('No wallet connected');
    }

    try {
      console.log('[HIP-3] Enabling DEX abstraction...');

      const nonce = Date.now();
      const hyperliquidChain = isTestnet() ? 'Testnet' : 'Mainnet';
      const signatureChainId = isTestnet() ? '0x66eee' : '0xa4b1';

      // Since the SDK might not have a dedicated method for this yet,
      // we'll call it similar to how approveAgent works
      // The SDK should handle the signing internally
      const action = {
        type: 'userEnableDexAbstraction',
        hyperliquidChain,
        signatureChainId,
        user: address as `0x${string}`,
        enabled: true,
        nonce,
      };

      // Try to use the client's underlying request mechanism
      // @ts-ignore - Using internal API that might not be typed
      const result = await mainExchangeClient.request({
        action,
        nonce,
      });

      console.log('[HIP-3] DEX abstraction enabled:', result);
    } catch (error) {
      console.error('[HIP-3] Failed to enable DEX abstraction:', error);
      throw error;
    }
  }, [mainExchangeClient]);

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
      // Clear cached dex clients since they use the old wallet
      dexClientsRef.current = {};

      console.log('[SessionKey] Session key enabled successfully');

      // // Auto-enable HIP-3 DEX abstraction
      // try {
      //   await enableDexAbstraction(address);
      //   console.log('[SessionKey] HIP-3 DEX abstraction enabled successfully');
      // } catch (dexError) {
      //   console.warn('[SessionKey] Failed to enable HIP-3 DEX abstraction (non-blocking):', dexError);
      // }
    } catch (error) {
      console.error('[SessionKey] Failed to enable session key:', error);
      throw error;
    }
  }, [mainExchangeClient, enableDexAbstraction]);

  const disableSessionKey = useCallback(async (): Promise<void> => {
    try {
      console.log('[SessionKey] Disabling session key...');

      await clearSessionKey();

      setExchangeClient(mainExchangeClient);
      setSessionKey(null);
      // Clear cached dex clients since they use the old wallet
      dexClientsRef.current = {};

      console.log('[SessionKey] Session key disabled successfully');
    } catch (error) {
      console.error('[SessionKey] Failed to disable session key:', error);
      throw error;
    }
  }, [mainExchangeClient]);

  // Get or create a dex-specific exchange client for HIP-3 trading
  const getExchangeClientForDex = useCallback((dex: string): hl.ExchangeClient | null => {
    // For default dex or empty, use the regular exchange client
    if (!dex || dex === '') {
      return exchangeClient;
    }

    // Check if we already have a cached client for this dex
    if (dexClientsRef.current[dex]) {
      return dexClientsRef.current[dex];
    }

    // Need to create a new client for this dex
    // Use the same wallet that the current exchangeClient uses
    if (!exchangeClient) {
      console.warn(`[HIP-3] Cannot create dex client for ${dex}: no exchange client`);
      return null;
    }

    // Get the wallet from the current setup
    // If session key is active, use that; otherwise use the main client's wallet
    const wallet = (exchangeClient as any)._wallet || (exchangeClient as any).wallet;
    if (!wallet) {
      console.warn(`[HIP-3] Cannot create dex client for ${dex}: no wallet found`);
      return exchangeClient; // Fall back to default client
    }

    console.log(`[HIP-3] Creating dex-specific client for: ${dex}`);
    const transport = createHttpTransport();
    const dexClient = createExchangeClient(wallet, transport, dex);
    dexClientsRef.current[dex] = dexClient;

    return dexClient;
  }, [exchangeClient]);

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
    pausePolling,
    resumePolling,
    getExchangeClientForDex,
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

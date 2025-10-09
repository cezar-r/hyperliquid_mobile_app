import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import * as hl from '@nktkas/hyperliquid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createWebSocketTransport,
  createSubscriptionClient,
  createInfoClient,
  createHttpTransport,
} from '../lib/hyperliquid';
import {
  fetchPerpMarkets,
  fetchSpotMarkets,
  resolveSubscriptionCoin,
  getDefaultCoin,
} from '../lib/markets';
import type {
  WebSocketState,
  MarketType,
  PerpMarket,
  SpotMarket,
  Orderbook,
  Trade,
} from '../types';

const MARKET_TYPE_KEY = 'hl_market_type';
const SELECTED_COIN_PERP_KEY = 'hl_selected_coin_perp';
const SELECTED_COIN_SPOT_KEY = 'hl_selected_coin_spot';

interface WebSocketContextValue {
  state: WebSocketState;
  selectCoin: (coin: string) => void;
  setMarketType: (type: MarketType) => void;
  subscribeToOrderbook: (coin: string) => void;
  unsubscribeFromOrderbook: () => void;
  subscribeToTrades: (coin: string) => void;
  unsubscribeFromTrades: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    perpMarkets: [],
    spotMarkets: [],
    marketType: 'perp',
    selectedCoin: null,
    prices: {},
    assetContexts: {},
    orderbook: null,
    recentTrades: [],
  });

  const wsTransportRef = useRef<hl.WebSocketTransport | null>(null);
  const subscriptionClientRef = useRef<hl.SubscriptionClient | null>(null);
  const infoClientRef = useRef<hl.InfoClient | null>(null);
  const allMidsSubIdRef = useRef<any>(null);
  const orderbookSubIdRef = useRef<any>(null);
  const tradesSubIdRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const cleanup: Array<() => void> = [];

    async function initialize(): Promise<void> {
      try {
        console.log('[Phase 4] Initializing WebSocket...');

        const httpTransport = createHttpTransport();
        const infoClient = createInfoClient(httpTransport);
        infoClientRef.current = infoClient;

        const [perpResult, spotResult] = await Promise.all([
          fetchPerpMarkets(infoClient),
          fetchSpotMarkets(infoClient),
        ]);

        console.log('[Phase 4] Loaded markets:', {
          perp: perpResult.markets.length,
          spot: spotResult.markets.length,
        });

        const savedMarketType = await AsyncStorage.getItem(MARKET_TYPE_KEY);
        const marketType: MarketType =
          savedMarketType === 'spot' ? 'spot' : 'perp';

        const savedCoinKey =
          marketType === 'perp'
            ? SELECTED_COIN_PERP_KEY
            : SELECTED_COIN_SPOT_KEY;
        const savedCoin = await AsyncStorage.getItem(savedCoinKey);

        const defaultCoin = getDefaultCoin(
          marketType,
          perpResult.markets,
          spotResult.markets
        );
        const selectedCoin = savedCoin || defaultCoin;

        if (!mounted) return;

        const combinedContexts = {
          ...perpResult.contexts,
          ...spotResult.contexts,
        };

        setState((prev) => ({
          ...prev,
          perpMarkets: perpResult.markets,
          spotMarkets: spotResult.markets,
          assetContexts: combinedContexts,
          marketType,
          selectedCoin,
        }));

        const transport = createWebSocketTransport();
        wsTransportRef.current = transport;
        const client = createSubscriptionClient(transport);
        subscriptionClientRef.current = client;

        await transport.ready();

        if (!mounted) return;

        console.log('[Phase 4] WebSocket connected');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));

        const allMidsSub = await client.allMids((data: any) => {
          if (!mounted) return;
          
          setState((prev) => {
            const priceMap: Record<string, string> = {};

            if (data.mids && typeof data.mids === 'object') {
              Object.entries(data.mids).forEach(([coin, price]) => {
                if (typeof price === 'string') {
                  if (coin.startsWith('@')) {
                    const spotIndex = parseInt(coin.substring(1), 10);
                    const spotMarket = prev.spotMarkets.find(
                      (m: SpotMarket) => m.index === spotIndex
                    );
                    if (spotMarket) {
                      priceMap[spotMarket.name] = price;
                    }
                  } else {
                    priceMap[coin] = price;
                  }
                }
              });
            }

            return { ...prev, prices: priceMap };
          });
        });

        allMidsSubIdRef.current = allMidsSub;

        cleanup.push(() => {
          if (allMidsSubIdRef.current) {
            allMidsSubIdRef.current
              .unsubscribe()
              .catch((err: any) => {
                if (!err.message?.includes('WebSocket connection closed')) {
                  console.error('[Phase 4] Error unsubscribing allMids:', err);
                }
              });
            allMidsSubIdRef.current = null;
          }
        });

        console.log('[Phase 4] ✓ WebSocket initialized');
      } catch (error: any) {
        console.error('[Phase 4] WebSocket initialization error:', error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: error.message || 'WebSocket connection failed',
          }));
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      cleanup.forEach((fn) => fn());

      if (wsTransportRef.current) {
        try {
          wsTransportRef.current.close();
        } catch (error) {
          console.log('[Phase 4] Expected error during cleanup:', error);
        }
      }

      wsTransportRef.current = null;
      subscriptionClientRef.current = null;
      infoClientRef.current = null;
      allMidsSubIdRef.current = null;
      orderbookSubIdRef.current = null;
      tradesSubIdRef.current = null;
    };
  }, []);

  const selectCoin = useCallback(
    async (coin: string) => {
      setState((prev) => ({ ...prev, selectedCoin: coin }));

      const storageKey =
        state.marketType === 'perp'
          ? SELECTED_COIN_PERP_KEY
          : SELECTED_COIN_SPOT_KEY;

      await AsyncStorage.setItem(storageKey, coin);
      console.log('[Phase 4] Selected coin:', coin);
    },
    [state.marketType]
  );

  const setMarketType = useCallback(
    async (type: MarketType) => {
      setState((prev) => {
        const newCoin = getDefaultCoin(
          type,
          prev.perpMarkets,
          prev.spotMarkets
        );
        return {
          ...prev,
          marketType: type,
          selectedCoin: newCoin,
          orderbook: null,
          recentTrades: [],
        };
      });

      await AsyncStorage.setItem(MARKET_TYPE_KEY, type);
      console.log('[Phase 4] Market type changed to:', type);
    },
    []
  );

  const subscribeToOrderbook = useCallback(
    async (coin: string) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (orderbookSubIdRef.current) {
        await orderbookSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 4] Error unsubscribing orderbook:', err);
          }
        });
        orderbookSubIdRef.current = null;
      }

      const subscriptionCoin = resolveSubscriptionCoin(
        state.marketType,
        coin,
        state.spotMarkets
      );

      console.log('[Phase 4] Subscribing to orderbook:', subscriptionCoin);

      const sub = await client.l2Book(
        { coin: subscriptionCoin },
        (data: any) => {
          const orderbook: Orderbook = {
            coin: data.coin,
            time: data.time,
            levels: data.levels,
          };
          setState((prev) => ({ ...prev, orderbook }));
        }
      );

      orderbookSubIdRef.current = sub;
    },
    [state.marketType, state.spotMarkets]
  );

  const unsubscribeFromOrderbook = useCallback(async () => {
    if (!orderbookSubIdRef.current) return;

    await orderbookSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 4] Error unsubscribing orderbook:', err);
      }
    });
    orderbookSubIdRef.current = null;
    setState((prev) => ({ ...prev, orderbook: null }));
    console.log('[Phase 4] Unsubscribed from orderbook');
  }, []);

  const subscribeToTrades = useCallback(
    async (coin: string) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (tradesSubIdRef.current) {
        await tradesSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 4] Error unsubscribing trades:', err);
          }
        });
        tradesSubIdRef.current = null;
      }

      const subscriptionCoin = resolveSubscriptionCoin(
        state.marketType,
        coin,
        state.spotMarkets
      );

      console.log('[Phase 4] Subscribing to trades:', subscriptionCoin);

      const sub = await client.trades({ coin: subscriptionCoin }, (trades: any) => {
        setState((prev) => {
          const newTrades: Trade[] = trades.map((t: any) => ({
            coin: t.coin,
            side: t.side,
            px: t.px,
            sz: t.sz,
            time: t.time,
            hash: t.hash,
            tid: t.tid,
          }));

          const combined = [...newTrades, ...prev.recentTrades].slice(0, 50);
          return { ...prev, recentTrades: combined };
        });
      });

      tradesSubIdRef.current = sub;
    },
    [state.marketType, state.spotMarkets]
  );

  const unsubscribeFromTrades = useCallback(async () => {
    if (!tradesSubIdRef.current) return;

    await tradesSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 4] Error unsubscribing trades:', err);
      }
    });
    tradesSubIdRef.current = null;
    setState((prev) => ({ ...prev, recentTrades: [] }));
    console.log('[Phase 4] Unsubscribed from trades');
  }, []);

  const value: WebSocketContextValue = {
    state,
    selectCoin,
    setMarketType,
    subscribeToOrderbook,
    unsubscribeFromOrderbook,
    subscribeToTrades,
    unsubscribeFromTrades,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}


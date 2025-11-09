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
import {
  logWebSocketSubscription,
  logWebSocketUnsubscription,
  logWebSocketData,
  logWebSocketConnection,
  logWebSocketMode,
  logDataUpdate,
} from '../lib/logger';
import type {
  WebSocketState,
  MarketType,
  PerpMarket,
  SpotMarket,
  Orderbook,
  Trade,
  Candle,
  CandleInterval,
} from '../types';

const MARKET_TYPE_KEY = 'hl_market_type';
const SELECTED_COIN_PERP_KEY = 'hl_selected_coin_perp';
const SELECTED_COIN_SPOT_KEY = 'hl_selected_coin_spot';

interface WebSocketContextValue {
  state: WebSocketState;
  infoClient: hl.InfoClient | null;
  selectCoin: (coin: string) => void;
  setMarketType: (type: MarketType) => void;
  subscribeToOrderbook: (
    coin: string,
    opts?: { nSigFigs?: number; mantissa?: number }
  ) => void;
  // ChartScreen performance mode (conditional subscriptions)
  enterChartMode: () => Promise<void>;
  exitChartMode: () => Promise<void>;
  unsubscribeFromOrderbook: () => void;
  subscribeToTrades: (coin: string) => void;
  unsubscribeFromTrades: () => void;
  subscribeToCandles: (
    coin: string,
    interval: CandleInterval,
    onCandle: (candle: Candle) => void
  ) => Promise<void>;
  unsubscribeFromCandles: () => Promise<void>;
  subscribeToUserEvents: (userAddress: string, onEvent: (event: any) => void) => Promise<void>;
  unsubscribeFromUserEvents: () => Promise<void>;
  subscribeToUserFills: (userAddress: string, onFill: (fills: any) => void) => Promise<void>;
  unsubscribeFromUserFills: () => Promise<void>;
  subscribeToUserFundings: (userAddress: string, onFunding: (funding: any) => void) => Promise<void>;
  unsubscribeFromUserFundings: () => Promise<void>;
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
  const candleSubIdRef = useRef<any>(null);
  const userEventsSubIdRef = useRef<any>(null);
  const userFillsSubIdRef = useRef<any>(null);
  const userFundingsSubIdRef = useRef<any>(null);
  const activeOrderbookCoinRef = useRef<string | null>(null);
  const activeTradesCoinRef = useRef<string | null>(null);
  const allPerpAssetCtxSubsRef = useRef<any[]>([]);
  const allSpotAssetCtxSubsRef = useRef<any[]>([]);
  // Subscription mode management
  const subscriptionModeRef = useRef<'global' | 'chart'>('global');
  const singleAssetCtxSubRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const cleanup: Array<() => void> = [];

    async function subscribeToAllAssetContexts(
      client: hl.SubscriptionClient,
      perpMarkets: PerpMarket[],
      spotMarkets: SpotMarket[],
      isMounted: boolean
    ): Promise<void> {
      try {
        logWebSocketSubscription('asset contexts', `perp: ${perpMarkets.length}, spot: ${spotMarkets.length}`);

        // console.log(JSON.stringify(perpMarkets, null, 2));


        // Subscribe to perp asset contexts
        const perpSubs = await Promise.all(
          perpMarkets.map(async (market) => {
            try {
              const sub = await client.activeAssetCtx(
                { coin: market.name },
                (data: any) => {
                  if (!isMounted) return;

                  // Convert API string values to numbers for app compatibility
                  const ctx = {
                    dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                    prevDayPx: parseFloat(data.ctx.prevDayPx),
                    markPx: parseFloat(data.ctx.markPx),
                    midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                    funding: parseFloat(data.ctx.funding),
                    openInterest: parseFloat(data.ctx.openInterest),
                  };

                  setState((prev) => ({
                    ...prev,
                    assetContexts: {
                      ...prev.assetContexts,
                      [market.name]: ctx,
                    },
                  }));
                }
              );
              return sub;
            } catch (error) {
              console.error(`[Phase 4] Error subscribing to perp ${market.name}:`, error);
              return null;
            }
          })
        );

        allPerpAssetCtxSubsRef.current = perpSubs.filter((sub) => sub !== null);
        logWebSocketData('activeAssetCtx (perp)', allPerpAssetCtxSubsRef.current.length, 'subscriptions active');

        // Subscribe to spot asset contexts
        const spotSubs = await Promise.all(
          spotMarkets.map(async (market) => {
            try {
              // PURR/USDC uses its literal name, not @{index} format
              const subscriptionCoin = market.name === 'PURR/USDC' 
                ? 'PURR/USDC' 
                : `@${market.index}`;
              
              const sub = await client.activeSpotAssetCtx(
                { coin: subscriptionCoin },
                (data: any) => {
                  if (!isMounted) return;

                  // Convert API string values to numbers for app compatibility
                  const ctx = {
                    dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                    prevDayPx: parseFloat(data.ctx.prevDayPx),
                    markPx: parseFloat(data.ctx.markPx),
                    midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                    circulatingSupply: parseFloat(data.ctx.circulatingSupply),
                  };

                  // Map from @{index} to display name (e.g., "PURR/USDC")
                  setState((prev) => ({
                    ...prev,
                    assetContexts: {
                      ...prev.assetContexts,
                      [market.name]: ctx,
                    },
                  }));
                }
              );
              return sub;
            } catch (error) {
              console.error(`[Phase 4] Error subscribing to spot ${market.name}:`, error);
              return null;
            }
          })
        );

        allSpotAssetCtxSubsRef.current = spotSubs.filter((sub) => sub !== null);
        logWebSocketData('activeSpotAssetCtx', allSpotAssetCtxSubsRef.current.length, 'subscriptions active');
      } catch (error) {
        console.error('[Phase 4] Error subscribing to asset contexts:', error);
      }
    }

    async function initialize(): Promise<void> {
      try {
        logWebSocketConnection('disconnected', 'Initializing WebSocket...');

        const httpTransport = createHttpTransport();
        const infoClient = createInfoClient(httpTransport);
        infoClientRef.current = infoClient;

        const [perpResult, spotResult] = await Promise.all([
          fetchPerpMarkets(infoClient),
          fetchSpotMarkets(infoClient),
        ]);

        logDataUpdate('WebSocket', `Markets loaded - perp: ${perpResult.markets.length}, spot: ${spotResult.markets.length}`);

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

        logWebSocketConnection('connected');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));

        logWebSocketSubscription('allMids');
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

            logWebSocketData('allMids', Object.keys(priceMap).length);
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

        // Subscribe to asset contexts for all markets
        await subscribeToAllAssetContexts(
          client,
          perpResult.markets,
          spotResult.markets,
          mounted
        );

        cleanup.push(() => {
          // Cleanup perp asset context subscriptions
          allPerpAssetCtxSubsRef.current.forEach((sub) => {
            sub?.unsubscribe().catch((err: any) => {
              if (!err.message?.includes('WebSocket connection closed')) {
                console.error('[Phase 4] Error unsubscribing perp asset ctx:', err);
              }
            });
          });
          allPerpAssetCtxSubsRef.current = [];

          // Cleanup spot asset context subscriptions
          allSpotAssetCtxSubsRef.current.forEach((sub) => {
            sub?.unsubscribe().catch((err: any) => {
              if (!err.message?.includes('WebSocket connection closed')) {
                console.error('[Phase 4] Error unsubscribing spot asset ctx:', err);
              }
            });
          });
          allSpotAssetCtxSubsRef.current = [];
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
      candleSubIdRef.current = null;
      userEventsSubIdRef.current = null;
      userFillsSubIdRef.current = null;
      userFundingsSubIdRef.current = null;
    };
  }, []);

  const selectCoin = useCallback(
    async (coin: string) => {
      setState((prev) => ({ 
        ...prev, 
        selectedCoin: coin,
        orderbook: null,
        recentTrades: [],
      }));

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
    async (coin: string, opts?: { nSigFigs?: number; mantissa?: number }) => {
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

      logWebSocketSubscription('l2Book (orderbook)', `coin: ${subscriptionCoin}`);

      const params: any = { coin: subscriptionCoin };
      // if (opts?.nSigFigs !== undefined) params.nSigFigs = opts.nSigFigs;
      // if (opts?.mantissa !== undefined) params.mantissa = opts.mantissa;
      console.log('[Phase 4] l2Book params:', params);

      activeOrderbookCoinRef.current = subscriptionCoin;

      const sub = await client.l2Book(
        params,
        (data: any) => {
          // Validate that the incoming data matches the currently active subscription
          if (data.coin !== activeOrderbookCoinRef.current) {
            console.log('[Phase 4] Ignoring stale orderbook data for:', data.coin);
            return;
          }

          const orderbook: Orderbook = {
            coin: data.coin,
            time: data.time,
            levels: data.levels,
          };
          const totalLevels = data.levels?.[0]?.length + data.levels?.[1]?.length || 0;
          logWebSocketData('l2Book (orderbook)', totalLevels, `levels for ${data.coin}`);
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
    // Don't clear activeOrderbookCoinRef here - it tracks the CURRENTLY ACTIVE subscription
    setState((prev) => ({ ...prev, orderbook: null }));
    logWebSocketUnsubscription('l2Book (orderbook)');
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

      logWebSocketSubscription('trades', `coin: ${subscriptionCoin}`);

      activeTradesCoinRef.current = subscriptionCoin;

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

          // Validate that all incoming trades match the currently active subscription
          const validTrades = newTrades.filter(t => t.coin === activeTradesCoinRef.current);
          
          if (validTrades.length !== newTrades.length) {
            console.log('[Phase 4] Ignoring', newTrades.length - validTrades.length, 'stale trades');
          }

          if (validTrades.length === 0) {
            return prev;
          }

          logWebSocketData('trades', validTrades.length, `for ${subscriptionCoin}`);
          const combined = [...validTrades, ...prev.recentTrades].slice(0, 50);
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
    // Don't clear activeTradesCoinRef here - it tracks the CURRENTLY ACTIVE subscription
    setState((prev) => ({ ...prev, recentTrades: [] }));
    logWebSocketUnsubscription('trades');
  }, []);

  const subscribeToCandles = useCallback(
    async (
      coin: string,
      interval: CandleInterval,
      onCandle: (candle: Candle) => void
    ) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (candleSubIdRef.current) {
        await candleSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 5] Error unsubscribing candles:', err);
          }
        });
        candleSubIdRef.current = null;
      }

      const subscriptionCoin = resolveSubscriptionCoin(
        state.marketType,
        coin,
        state.spotMarkets
      );

      logWebSocketSubscription('candle', `coin: ${subscriptionCoin}, interval: ${interval}`);

      const sub = await client.candle(
        { coin: subscriptionCoin, interval },
        (data: any) => {
          const candle: Candle = {
            t: data.t,
            T: data.T,
            o: data.o,
            h: data.h,
            l: data.l,
            c: data.c,
            v: data.v,
            n: data.n,
          };
          logWebSocketData('candle', 1, `${subscriptionCoin} @ ${interval}`);
          onCandle(candle);
        }
      );

      candleSubIdRef.current = sub;
    },
    [state.marketType, state.spotMarkets]
  );

  const unsubscribeFromCandles = useCallback(async () => {
    if (!candleSubIdRef.current) return;

    await candleSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 5] Error unsubscribing candles:', err);
      }
    });
    candleSubIdRef.current = null;
    logWebSocketUnsubscription('candle');
  }, []);

  const subscribeToUserEvents = useCallback(
    async (userAddress: string, onEvent: (event: any) => void) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (userEventsSubIdRef.current) {
        await userEventsSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[UserAccount] Error unsubscribing userEvents:', err);
          }
        });
        userEventsSubIdRef.current = null;
      }

      logWebSocketSubscription('userEvents', `user: ${userAddress}`);

      const sub = await (client as any).user({ user: userAddress as `0x${string}` }, (data: any) => {
        logWebSocketData('userEvents', 1);
        onEvent(data);
      });

      userEventsSubIdRef.current = sub;
    },
    []
  );

  const unsubscribeFromUserEvents = useCallback(async () => {
    if (!userEventsSubIdRef.current) return;

    await userEventsSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[UserAccount] Error unsubscribing userEvents:', err);
      }
    });
    userEventsSubIdRef.current = null;
    console.log('[UserAccount] Unsubscribed from userEvents');
  }, []);

  const subscribeToUserFills = useCallback(
    async (userAddress: string, onFill: (fills: any) => void) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (userFillsSubIdRef.current) {
        await userFillsSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[UserAccount] Error unsubscribing userFills:', err);
          }
        });
        userFillsSubIdRef.current = null;
      }

      logWebSocketSubscription('userFills', `user: ${userAddress}`);

      const sub = await client.userFills({ user: userAddress as `0x${string}` }, (data: any) => {
        logWebSocketData('userFills', 1);
        onFill(data);
      });

      userFillsSubIdRef.current = sub;
    },
    []
  );

  const unsubscribeFromUserFills = useCallback(async () => {
    if (!userFillsSubIdRef.current) return;

    await userFillsSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[UserAccount] Error unsubscribing userFills:', err);
      }
    });
    userFillsSubIdRef.current = null;
    console.log('[UserAccount] Unsubscribed from userFills');
  }, []);

  const subscribeToUserFundings = useCallback(
    async (userAddress: string, onFunding: (funding: any) => void) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      if (userFundingsSubIdRef.current) {
        await userFundingsSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[UserAccount] Error unsubscribing userFundings:', err);
          }
        });
        userFundingsSubIdRef.current = null;
      }

      logWebSocketSubscription('userFundings', `user: ${userAddress}`);

      const sub = await client.userFundings({ user: userAddress as `0x${string}` }, (data: any) => {
        logWebSocketData('userFundings', 1);
        onFunding(data);
      });

      userFundingsSubIdRef.current = sub;
    },
    []
  );

  const unsubscribeFromUserFundings = useCallback(async () => {
    if (!userFundingsSubIdRef.current) return;

    await userFundingsSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[UserAccount] Error unsubscribing userFundings:', err);
      }
    });
    userFundingsSubIdRef.current = null;
    console.log('[UserAccount] Unsubscribed from userFundings');
  }, []);

  // ===== Chart mode: conditional subscriptions (ChartScreen only) =====
  const unsubscribeAllAssetCtx = useCallback(async (): Promise<void> => {
    // Perp asset contexts
    allPerpAssetCtxSubsRef.current.forEach((sub) => {
      sub?.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[Phase 4] Error unsubscribing perp asset ctx:', err);
        }
      });
    });
    allPerpAssetCtxSubsRef.current = [];
    // Spot asset contexts
    allSpotAssetCtxSubsRef.current.forEach((sub) => {
      sub?.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[Phase 4] Error unsubscribing spot asset ctx:', err);
        }
      });
    });
    allSpotAssetCtxSubsRef.current = [];
  }, []);

  const unsubscribeAllMids = useCallback(async (): Promise<void> => {
    if (allMidsSubIdRef.current) {
      await allMidsSubIdRef.current.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[Phase 4] Error unsubscribing allMids:', err);
        }
      });
      allMidsSubIdRef.current = null;
    }
  }, []);

  const unsubscribeSingleAssetCtx = useCallback(async (): Promise<void> => {
    if (singleAssetCtxSubRef.current) {
      await singleAssetCtxSubRef.current.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[Phase 4] Error unsubscribing single asset ctx:', err);
        }
      });
      singleAssetCtxSubRef.current = null;
    }
  }, []);

  const subscribeSingleAssetCtx = useCallback(async (): Promise<void> => {
    const client = subscriptionClientRef.current;
    if (!client) return;
    const coin = state.selectedCoin;
    if (!coin) return;

    // Ensure previous single subscription is cleared
    await unsubscribeSingleAssetCtx();

    try {
      if (state.marketType === 'perp') {
        console.log('[Phase 4] [ChartMode] Subscribing single perp asset ctx:', coin);
        const sub = await client.activeAssetCtx({ coin }, (data: any) => {
          const ctx = {
            dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
            prevDayPx: parseFloat(data.ctx.prevDayPx),
            markPx: parseFloat(data.ctx.markPx),
            midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
            funding: parseFloat(data.ctx.funding),
            openInterest: parseFloat(data.ctx.openInterest),
          };
          setState((prev) => ({
            ...prev,
            assetContexts: {
              ...prev.assetContexts,
              [coin]: ctx,
            },
          }));
        });
        singleAssetCtxSubRef.current = sub;
      } else {
        const subscriptionCoin = resolveSubscriptionCoin('spot', coin, state.spotMarkets);
        console.log('[Phase 4] [ChartMode] Subscribing single spot asset ctx:', { coin, subscriptionCoin });
        const sub = await (client as any).activeSpotAssetCtx({ coin: subscriptionCoin }, (data: any) => {
          const ctx = {
            dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
            prevDayPx: parseFloat(data.ctx.prevDayPx),
            markPx: parseFloat(data.ctx.markPx),
            midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
            circulatingSupply: parseFloat(data.ctx.circulatingSupply),
          };
          setState((prev) => ({
            ...prev,
            assetContexts: {
              ...prev.assetContexts,
              [coin]: ctx,
            },
          }));
        });
        singleAssetCtxSubRef.current = sub;
      }
    } catch (error) {
      console.error('[Phase 4] [ChartMode] Error subscribing single asset ctx:', error);
    }
  }, [state.selectedCoin, state.marketType, state.spotMarkets, unsubscribeSingleAssetCtx]);

  const resubscribeGlobal = useCallback(async (): Promise<void> => {
    const client = subscriptionClientRef.current;
    if (!client) return;
    console.log('[Phase 4] Restoring global subscriptions (allMids + all asset contexts)');
    // Re-subscribe allMids
    try {
      const sub = await client.allMids((data: any) => {
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
      allMidsSubIdRef.current = sub;
    } catch (error) {
      console.error('[Phase 4] Error restoring allMids:', error);
    }

    // Re-subscribe asset contexts for all markets
    try {
      // Perp markets
      const clientAny: any = client;
      const perpSubs = await Promise.all(
        state.perpMarkets.map(async (market) => {
          try {
            const sub = await client.activeAssetCtx(
              { coin: market.name },
              (data: any) => {
                const ctx = {
                  dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                  prevDayPx: parseFloat(data.ctx.prevDayPx),
                  markPx: parseFloat(data.ctx.markPx),
                  midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                  funding: parseFloat(data.ctx.funding),
                  openInterest: parseFloat(data.ctx.openInterest),
                };
                setState((prev) => ({
                  ...prev,
                  assetContexts: {
                    ...prev.assetContexts,
                    [market.name]: ctx,
                  },
                }));
              }
            );
            return sub;
          } catch (error) {
            console.error(`[Phase 4] Error re-subscribing perp ${market.name}:`, error);
            return null;
          }
        })
      );
      allPerpAssetCtxSubsRef.current = perpSubs.filter((sub) => sub !== null);

      // Spot markets
      const spotSubs = await Promise.all(
        state.spotMarkets.map(async (market) => {
          try {
            const subscriptionCoin =
              market.name === 'PURR/USDC' ? 'PURR/USDC' : `@${market.index}`;
            const sub = await clientAny.activeSpotAssetCtx(
              { coin: subscriptionCoin },
              (data: any) => {
                const ctx = {
                  dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                  prevDayPx: parseFloat(data.ctx.prevDayPx),
                  markPx: parseFloat(data.ctx.markPx),
                  midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                  circulatingSupply: parseFloat(data.ctx.circulatingSupply),
                };
                setState((prev) => ({
                  ...prev,
                  assetContexts: {
                    ...prev.assetContexts,
                    [market.name]: ctx,
                  },
                }));
              }
            );
            return sub;
          } catch (error) {
            console.error(`[Phase 4] Error re-subscribing spot ${market.name}:`, error);
            return null;
          }
        })
      );
      allSpotAssetCtxSubsRef.current = spotSubs.filter((sub) => sub !== null);
      console.log('[Phase 4] ✓ Global subscriptions restored:', {
        perpCtx: allPerpAssetCtxSubsRef.current.length,
        spotCtx: allSpotAssetCtxSubsRef.current.length,
      });
    } catch (error) {
      console.error('[Phase 4] Error restoring asset contexts:', error);
    }
  }, [state.perpMarkets, state.spotMarkets]);

  const enterChartMode = useCallback(async (): Promise<void> => {
    if (subscriptionModeRef.current === 'chart') return;
    subscriptionModeRef.current = 'chart';
    logWebSocketMode('Chart Mode (single asset context)');
    await unsubscribeAllMids();
    await unsubscribeAllAssetCtx();
    await subscribeSingleAssetCtx();
  }, [unsubscribeAllMids, unsubscribeAllAssetCtx, subscribeSingleAssetCtx]);

  const exitChartMode = useCallback(async (): Promise<void> => {
    if (subscriptionModeRef.current === 'global') return;
    subscriptionModeRef.current = 'global';
    logWebSocketMode('Global Mode (all markets)');
    await unsubscribeSingleAssetCtx();
    await resubscribeGlobal();
  }, [unsubscribeSingleAssetCtx, resubscribeGlobal]);

  // Re-subscribe the single asset context when coin or market type changes during Chart Mode
  useEffect(() => {
    if (subscriptionModeRef.current !== 'chart') return;
    subscribeSingleAssetCtx();
  }, [state.selectedCoin, state.marketType, subscribeSingleAssetCtx]);

  const value: WebSocketContextValue = {
    state,
    infoClient: infoClientRef.current,
    selectCoin,
    setMarketType,
    subscribeToOrderbook,
    enterChartMode,
    exitChartMode,
    unsubscribeFromOrderbook,
    subscribeToTrades,
    unsubscribeFromTrades,
    subscribeToCandles,
    unsubscribeFromCandles,
    subscribeToUserEvents,
    unsubscribeFromUserEvents,
    subscribeToUserFills,
    unsubscribeFromUserFills,
    subscribeToUserFundings,
    unsubscribeFromUserFundings,
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


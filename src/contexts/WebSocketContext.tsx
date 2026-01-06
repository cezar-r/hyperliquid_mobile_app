import React, {
  createContext,
  useContext,
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
  fetchAllDexMarkets,
  fetchSpotMarkets,
  resolveSubscriptionCoin,
  getDefaultCoin,
  createHIP3Market,
} from '../lib/markets';
import { HIP3_DEXES } from '../constants/constants';
import {
  logWebSocketSubscription,
  logWebSocketUnsubscription,
  logWebSocketData,
  logWebSocketConnection,
  logWebSocketMode,
  logDataUpdate,
} from '../lib/logger';
import { useAppVisibility } from '../hooks/useAppVisibility';
import { useWebSocketStore, getWebSocketState } from '../stores';
import type {
  WebSocketState,
  MarketType,
  PerpMarket,
  SpotMarket,
  Orderbook,
  Trade,
  Candle,
  CandleInterval,
  AssetContext,
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
  // Get store state for backward compatibility (state object)
  const storeState = useWebSocketStore();

  // Track app visibility for background/foreground subscription management
  const isAppActive = useAppVisibility();
  const isInitializedRef = useRef(false);

  // Refs for WebSocket resources
  const wsTransportRef = useRef<hl.WebSocketTransport | null>(null);
  const subscriptionClientRef = useRef<hl.SubscriptionClient | null>(null);
  const infoClientRef = useRef<hl.InfoClient | null>(null);
  const allMidsSubIdRef = useRef<any>(null);
  const allMidsSubIdsRef = useRef<any[]>([]);
  const orderbookSubIdRef = useRef<any>(null);
  const tradesSubIdRef = useRef<any>(null);
  const candleSubIdRef = useRef<any>(null);
  const userEventsSubIdRef = useRef<any>(null);
  const userFillsSubIdRef = useRef<any>(null);
  const userFundingsSubIdRef = useRef<any>(null);
  const activeOrderbookCoinRef = useRef<string | null>(null);
  const activeOrderbookNSigFigsRef = useRef<number | undefined>(undefined);
  const activeOrderbookMantissaRef = useRef<number | undefined>(undefined);
  const activeTradesCoinRef = useRef<string | null>(null);
  // Track active candle subscription to prevent duplicates
  const activeCandleCoinRef = useRef<string | null>(null);
  const activeCandleIntervalRef = useRef<CandleInterval | null>(null);
  const allPerpAssetCtxSubsRef = useRef<any[]>([]);
  const allSpotAssetCtxSubsRef = useRef<any[]>([]);
  const subscriptionModeRef = useRef<'global' | 'chart'>('global');
  const singleAssetCtxSubRef = useRef<any>(null);

  // Refs for market data (to avoid callback dependencies)
  const perpMarketsRef = useRef<PerpMarket[]>([]);
  const spotMarketsRef = useRef<SpotMarket[]>([]);
  const marketTypeRef = useRef<MarketType>('perp');
  const selectedCoinRef = useRef<string | null>(null);

  // ============ BATCHING LOGIC ============
  const pendingPricesRef = useRef<Record<string, string>>({});
  const pendingContextsRef = useRef<Record<string, AssetContext>>({});
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttle batch updates to reduce re-renders (500ms instead of RAF at 60fps)
  const BATCH_FLUSH_INTERVAL_MS = 500;

  const flushUpdates = useCallback(() => {
    const store = useWebSocketStore.getState();

    if (Object.keys(pendingPricesRef.current).length > 0) {
      store.setBatchPrices(pendingPricesRef.current);
      pendingPricesRef.current = {};
    }

    if (Object.keys(pendingContextsRef.current).length > 0) {
      store.setBatchAssetContexts(pendingContextsRef.current);
      pendingContextsRef.current = {};
    }

    flushTimeoutRef.current = null;
  }, []);

  const scheduleBatchFlush = useCallback(() => {
    if (flushTimeoutRef.current === null) {
      flushTimeoutRef.current = setTimeout(flushUpdates, BATCH_FLUSH_INTERVAL_MS);
    }
  }, [flushUpdates]);

  // Keep refs in sync with store
  useEffect(() => {
    const unsubscribe = useWebSocketStore.subscribe(
      (state) => ({
        perpMarkets: state.perpMarkets,
        spotMarkets: state.spotMarkets,
        marketType: state.marketType,
        selectedCoin: state.selectedCoin,
      }),
      (current) => {
        perpMarketsRef.current = current.perpMarkets;
        spotMarketsRef.current = current.spotMarkets;
        marketTypeRef.current = current.marketType;
        selectedCoinRef.current = current.selectedCoin;
      }
    );
    return unsubscribe;
  }, []);

  // ============ INITIALIZATION ============
  useEffect(() => {
    let mounted = true;
    const cleanup: Array<() => void> = [];
    const store = useWebSocketStore.getState();

    async function subscribeToAllAssetContexts(
      client: hl.SubscriptionClient,
      perpMarkets: PerpMarket[],
      spotMarkets: SpotMarket[],
      isMounted: boolean
    ): Promise<void> {
      try {
        logWebSocketSubscription('asset contexts', `perp: ${perpMarkets.length}, spot: ${spotMarkets.length}`);

        // Subscribe to perp asset contexts (including HIP-3 dexes)
        const perpSubs = await Promise.all(
          perpMarkets.map(async (market) => {
            try {
              const subscriptionCoin = market.dex
                ? `${market.dex}:${market.name}`
                : market.name;

              const sub = await client.activeAssetCtx(
                { coin: subscriptionCoin },
                (data: any) => {
                  if (!isMounted) return;

                  const ctx: AssetContext = {
                    dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                    prevDayPx: parseFloat(data.ctx.prevDayPx),
                    markPx: parseFloat(data.ctx.markPx),
                    midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                    funding: parseFloat(data.ctx.funding),
                    openInterest: parseFloat(data.ctx.openInterest),
                  };

                  const contextKey = market.dex ? `${market.dex}:${market.name}` : market.name;

                  // Queue for batched update
                  pendingContextsRef.current[contextKey] = ctx;
                  scheduleBatchFlush();
                }
              );
              return sub;
            } catch (error) {
              const dexInfo = market.dex ? ` (${market.dex})` : '';
              console.error(`[Phase 4] Error subscribing to perp ${market.name}${dexInfo}:`, error);
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
              const subscriptionCoin = market.name === 'PURR/USDC'
                ? 'PURR/USDC'
                : `@${market.index}`;

              const sub = await (client as any).activeSpotAssetCtx(
                { coin: subscriptionCoin },
                (data: any) => {
                  if (!isMounted) return;

                  const ctx: AssetContext = {
                    dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                    prevDayPx: parseFloat(data.ctx.prevDayPx),
                    markPx: parseFloat(data.ctx.markPx),
                    midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                    circulatingSupply: parseFloat(data.ctx.circulatingSupply),
                  };

                  // Queue for batched update
                  pendingContextsRef.current[market.name] = ctx;
                  scheduleBatchFlush();
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
          fetchAllDexMarkets(infoClient),
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

        // Initialize store with all market data in a single update
        store.initializeMarkets({
          perpMarkets: perpResult.markets,
          spotMarkets: spotResult.markets,
          assetContexts: combinedContexts,
          marketType,
          selectedCoin,
        });

        // Update refs
        perpMarketsRef.current = perpResult.markets;
        spotMarketsRef.current = spotResult.markets;
        marketTypeRef.current = marketType;
        selectedCoinRef.current = selectedCoin;

        const transport = createWebSocketTransport();
        wsTransportRef.current = transport;
        const client = createSubscriptionClient(transport);
        subscriptionClientRef.current = client;

        await transport.ready();

        if (!mounted) return;

        logWebSocketConnection('connected');
        store.setConnected(true);
        store.setError(null);

        // Subscribe to allMids for default dex
        logWebSocketSubscription('allMids', 'default dex');
        const allMidsSub = await client.allMids((data: any) => {
          if (!mounted) return;

          const priceMap: Record<string, string> = {};

          if (data.mids && typeof data.mids === 'object') {
            Object.entries(data.mids).forEach(([coin, price]) => {
              if (typeof price === 'string') {
                if (coin.startsWith('@')) {
                  const spotIndex = parseInt(coin.substring(1), 10);
                  const spotMarket = spotMarketsRef.current.find(
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

          logWebSocketData('allMids (default)', Object.keys(data.mids || {}).length);

          // Queue for batched update
          Object.assign(pendingPricesRef.current, priceMap);
          scheduleBatchFlush();
        });

        allMidsSubIdRef.current = allMidsSub;

        // Subscribe to allMids for each HIP-3 dex (lazy - only on demand would be ideal, but keeping for now)
        const hip3MidsSubs = await Promise.all(
          HIP3_DEXES.map(async (dex) => {
            try {
              logWebSocketSubscription('allMids', `dex: ${dex}`);
              const sub = await client.allMids({ dex }, (data: any) => {
                if (!mounted) return;

                const priceMap: Record<string, string> = {};
                const newContexts: Record<string, AssetContext> = {};
                let newMarketAdded = false;

                if (data.mids && typeof data.mids === 'object') {
                  Object.entries(data.mids).forEach(([coin, price]) => {
                    if (typeof price === 'string') {
                      const parts = coin.split(':');
                      const symbol = parts.length > 1 ? parts[1] : coin;

                      // Store ALL HIP-3 prices (no whitelist filter)
                      const key = `${dex}:${symbol}`;
                      priceMap[key] = price;

                      const existingMarket = perpMarketsRef.current.find(
                        m => m.name === symbol && m.dex === dex
                      );

                      if (existingMarket) {
                        newContexts[key] = {
                          ...getWebSocketState().assetContexts[key],
                          markPx: parseFloat(price),
                        } as AssetContext;
                      } else {
                        const newMarket = createHIP3Market(dex, symbol);
                        store.addPerpMarket(newMarket);
                        perpMarketsRef.current = [...perpMarketsRef.current, newMarket];
                        newMarketAdded = true;
                        console.log(`[HIP-3] Created placeholder market ${key} from allMids`);

                        newContexts[key] = {
                          markPx: parseFloat(price),
                          dayNtlVlm: 0,
                          prevDayPx: parseFloat(price),
                          funding: 0,
                          openInterest: 0,
                        };
                      }
                    }
                  });
                }

                logWebSocketData(`allMids (${dex})`, Object.keys(data.mids || {}).length);

                // Queue for batched update
                Object.assign(pendingPricesRef.current, priceMap);
                Object.assign(pendingContextsRef.current, newContexts);
                scheduleBatchFlush();
              });
              return sub;
            } catch (error) {
              console.error(`[HIP-3] Error subscribing to allMids for ${dex}:`, error);
              return null;
            }
          })
        );

        allMidsSubIdsRef.current = hip3MidsSubs.filter((sub) => sub !== null);

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

          allMidsSubIdsRef.current.forEach((sub) => {
            sub?.unsubscribe().catch((err: any) => {
              if (!err.message?.includes('WebSocket connection closed')) {
                console.error('[HIP-3] Error unsubscribing allMids:', err);
              }
            });
          });
          allMidsSubIdsRef.current = [];
        });

        // Subscribe to asset contexts for all markets
        await subscribeToAllAssetContexts(
          client,
          perpResult.markets,
          spotResult.markets,
          mounted
        );

        cleanup.push(() => {
          allPerpAssetCtxSubsRef.current.forEach((sub) => {
            sub?.unsubscribe().catch((err: any) => {
              if (!err.message?.includes('WebSocket connection closed')) {
                console.error('[Phase 4] Error unsubscribing perp asset ctx:', err);
              }
            });
          });
          allPerpAssetCtxSubsRef.current = [];

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
        isInitializedRef.current = true;
      } catch (error: any) {
        console.error('[Phase 4] WebSocket initialization error:', error);
        if (mounted) {
          store.setConnected(false);
          store.setError(error.message || 'WebSocket connection failed');
        }
      }
    }

    initialize();

    return () => {
      mounted = false;

      // Cancel any pending batch flush
      if (flushTimeoutRef.current !== null) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

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
  }, [scheduleBatchFlush]);

  // ============ ACTIONS ============

  const selectCoin = useCallback(async (coin: string) => {
    const store = useWebSocketStore.getState();
    store.setSelectedCoin(coin);
    selectedCoinRef.current = coin;

    const storageKey =
      marketTypeRef.current === 'perp'
        ? SELECTED_COIN_PERP_KEY
        : SELECTED_COIN_SPOT_KEY;

    await AsyncStorage.setItem(storageKey, coin);
    console.log('[Phase 4] Selected coin:', coin);
  }, []);

  const setMarketType = useCallback(async (type: MarketType) => {
    const store = useWebSocketStore.getState();
    const newCoin = getDefaultCoin(
      type,
      perpMarketsRef.current,
      spotMarketsRef.current
    );

    store.setMarketType(type);
    store.setSelectedCoin(newCoin);
    marketTypeRef.current = type;
    selectedCoinRef.current = newCoin;

    await AsyncStorage.setItem(MARKET_TYPE_KEY, type);
    console.log('[Phase 4] Market type changed to:', type);
  }, []);

  const subscribeToOrderbook = useCallback(
    async (coin: string, opts?: { nSigFigs?: number; mantissa?: number }) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      // Skip if already subscribed to this coin (deduplication)
      const market = marketTypeRef.current === 'perp'
        ? perpMarketsRef.current.find(m => m.name === coin)
        : null;
      const dex = market?.dex;
      let subscriptionCoin = resolveSubscriptionCoin(
        marketTypeRef.current,
        coin,
        spotMarketsRef.current
      );
      if (dex) {
        subscriptionCoin = `${dex}:${coin}`;
      }

      // Skip if already subscribed with same params (coin + aggregation)
      if (
        activeOrderbookCoinRef.current === subscriptionCoin &&
        activeOrderbookNSigFigsRef.current === opts?.nSigFigs &&
        activeOrderbookMantissaRef.current === opts?.mantissa &&
        orderbookSubIdRef.current
      ) {
        return; // Already subscribed with same params
      }

      if (orderbookSubIdRef.current) {
        await orderbookSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 4] Error unsubscribing orderbook:', err);
          }
        });
        orderbookSubIdRef.current = null;
      }

      logWebSocketSubscription('l2Book (orderbook)', `coin: ${subscriptionCoin}, nSigFigs: ${opts?.nSigFigs}, mantissa: ${opts?.mantissa}`);

      const params: any = {
        coin: subscriptionCoin,
        ...(opts?.nSigFigs !== undefined && { nSigFigs: opts.nSigFigs }),
        ...(opts?.mantissa !== undefined && { mantissa: opts.mantissa }),
      };
      console.log('[Phase 4] l2Book params:', params);

      activeOrderbookCoinRef.current = subscriptionCoin;
      activeOrderbookNSigFigsRef.current = opts?.nSigFigs;
      activeOrderbookMantissaRef.current = opts?.mantissa;

      try {
        const sub = await client.l2Book(
          params,
          (data: any) => {
            // Silently ignore stale orderbook data from previous subscriptions
            if (data.coin !== activeOrderbookCoinRef.current) {
              return;
            }

            const orderbook: Orderbook = {
              coin: data.coin,
              time: data.time,
              levels: data.levels,
            };
            const totalLevels = data.levels?.[0]?.length + data.levels?.[1]?.length || 0;
            logWebSocketData('l2Book (orderbook)', totalLevels, `levels for ${data.coin}`);

            useWebSocketStore.getState().setOrderbook(orderbook);
          }
        );

        orderbookSubIdRef.current = sub;
        console.log('[Phase 4] l2Book subscription created successfully');
      } catch (error) {
        console.error('[Phase 4] l2Book subscription failed:', error);
        // Reset refs on failure
        activeOrderbookCoinRef.current = null;
        activeOrderbookNSigFigsRef.current = undefined;
        activeOrderbookMantissaRef.current = undefined;
      }
    },
    [] // No dependencies - uses refs
  );

  const unsubscribeFromOrderbook = useCallback(async () => {
    if (!orderbookSubIdRef.current) return;

    await orderbookSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 4] Error unsubscribing orderbook:', err);
      }
    });
    orderbookSubIdRef.current = null;
    // Note: Don't reset activeOrderbookCoinRef/nSigFigs/mantissa here!
    // Due to async race conditions with useEffect cleanup, subscribeToOrderbook
    // may have already set these to new values before this unsubscribe completes.
    // The subscribe function always sets them correctly before subscribing.
    logWebSocketUnsubscription('l2Book (orderbook)');
  }, []);

  const subscribeToTrades = useCallback(
    async (coin: string) => {
      const client = subscriptionClientRef.current;
      if (!client) return;

      const market = marketTypeRef.current === 'perp'
        ? perpMarketsRef.current.find(m => m.name === coin)
        : null;
      const dex = market?.dex;

      let subscriptionCoin = resolveSubscriptionCoin(
        marketTypeRef.current,
        coin,
        spotMarketsRef.current
      );

      if (dex) {
        subscriptionCoin = `${dex}:${coin}`;
      }

      // Skip if already subscribed (deduplication)
      if (activeTradesCoinRef.current === subscriptionCoin && tradesSubIdRef.current) {
        return;
      }

      if (tradesSubIdRef.current) {
        await tradesSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 4] Error unsubscribing trades:', err);
          }
        });
        tradesSubIdRef.current = null;
      }

      logWebSocketSubscription('trades', `coin: ${subscriptionCoin}`);

      activeTradesCoinRef.current = subscriptionCoin;

      const params: any = { coin: subscriptionCoin };

      const sub = await client.trades(params, (trades: any) => {
        const newTrades: Trade[] = trades.map((t: any) => ({
          coin: t.coin,
          side: t.side,
          px: t.px,
          sz: t.sz,
          time: t.time,
          hash: t.hash,
          tid: t.tid,
        }));

        // Filter out stale trades from previous subscriptions
        const validTrades = newTrades.filter(t => t.coin === activeTradesCoinRef.current);

        if (validTrades.length === 0) {
          return;
        }

        logWebSocketData('trades', validTrades.length, `for ${subscriptionCoin}`);
        useWebSocketStore.getState().addTrades(validTrades);
      });

      tradesSubIdRef.current = sub;
    },
    [] // No dependencies - uses refs
  );

  const unsubscribeFromTrades = useCallback(async () => {
    if (!tradesSubIdRef.current) return;

    await tradesSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 4] Error unsubscribing trades:', err);
      }
    });
    tradesSubIdRef.current = null;
    useWebSocketStore.getState().setRecentTrades([]);
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

      // Check if already subscribed to same coin/interval - prevent duplicate subscriptions
      if (
        activeCandleCoinRef.current === coin &&
        activeCandleIntervalRef.current === interval &&
        candleSubIdRef.current
      ) {
        console.log(`[WebSocket] Already subscribed to candles: ${coin} @ ${interval}, skipping`);
        return;
      }

      // Unsubscribe from previous subscription if exists
      if (candleSubIdRef.current) {
        await candleSubIdRef.current.unsubscribe().catch((err: any) => {
          if (!err.message?.includes('WebSocket connection closed')) {
            console.error('[Phase 5] Error unsubscribing candles:', err);
          }
        });
        candleSubIdRef.current = null;
        activeCandleCoinRef.current = null;
        activeCandleIntervalRef.current = null;
      }

      const market = marketTypeRef.current === 'perp'
        ? perpMarketsRef.current.find(m => m.name === coin)
        : null;
      const dex = market?.dex;

      let subscriptionCoin = resolveSubscriptionCoin(
        marketTypeRef.current,
        coin,
        spotMarketsRef.current
      );

      if (dex) {
        subscriptionCoin = `${dex}:${coin}`;
      }

      logWebSocketSubscription('candle', `coin: ${subscriptionCoin}, interval: ${interval}`);

      const params: any = { coin: subscriptionCoin, interval };

      const sub = await client.candle(
        params,
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
      activeCandleCoinRef.current = coin;
      activeCandleIntervalRef.current = interval;
    },
    [] // No dependencies - uses refs
  );

  const unsubscribeFromCandles = useCallback(async () => {
    if (!candleSubIdRef.current) return;

    await candleSubIdRef.current.unsubscribe().catch((err: any) => {
      if (!err.message?.includes('WebSocket connection closed')) {
        console.error('[Phase 5] Error unsubscribing candles:', err);
      }
    });
    candleSubIdRef.current = null;
    activeCandleCoinRef.current = null;
    activeCandleIntervalRef.current = null;
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

  // ============ CHART MODE ============

  const unsubscribeAllAssetCtx = useCallback(async (): Promise<void> => {
    allPerpAssetCtxSubsRef.current.forEach((sub) => {
      sub?.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[Phase 4] Error unsubscribing perp asset ctx:', err);
        }
      });
    });
    allPerpAssetCtxSubsRef.current = [];

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

    allMidsSubIdsRef.current.forEach((sub) => {
      sub?.unsubscribe().catch((err: any) => {
        if (!err.message?.includes('WebSocket connection closed')) {
          console.error('[HIP-3] Error unsubscribing allMids:', err);
        }
      });
    });
    allMidsSubIdsRef.current = [];
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
    const coin = selectedCoinRef.current;
    if (!coin) return;

    await unsubscribeSingleAssetCtx();

    try {
      if (marketTypeRef.current === 'perp') {
        const market = perpMarketsRef.current.find(m => m.name === coin);
        const dex = market?.dex || '';

        const subscriptionCoin = dex ? `${dex}:${coin}` : coin;

        console.log('[Phase 4] [ChartMode] Subscribing single perp asset ctx:', { coin: subscriptionCoin, originalCoin: coin, dex });
        const sub = await client.activeAssetCtx({ coin: subscriptionCoin }, (data: any) => {
          const ctx: AssetContext = {
            dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
            prevDayPx: parseFloat(data.ctx.prevDayPx),
            markPx: parseFloat(data.ctx.markPx),
            midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
            funding: parseFloat(data.ctx.funding),
            openInterest: parseFloat(data.ctx.openInterest),
          };

          const contextKey = dex ? `${dex}:${coin}` : coin;
          const priceKey = dex ? `${dex}:${coin}` : coin;

          const store = useWebSocketStore.getState();
          store.setAssetContext(contextKey, ctx);
          store.setPrice(priceKey, ctx.markPx.toString());
        });
        singleAssetCtxSubRef.current = sub;
      } else {
        const subscriptionCoin = resolveSubscriptionCoin('spot', coin, spotMarketsRef.current);
        console.log('[Phase 4] [ChartMode] Subscribing single spot asset ctx:', { coin, subscriptionCoin });
        const sub = await (client as any).activeSpotAssetCtx({ coin: subscriptionCoin }, (data: any) => {
          const ctx: AssetContext = {
            dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
            prevDayPx: parseFloat(data.ctx.prevDayPx),
            markPx: parseFloat(data.ctx.markPx),
            midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
            circulatingSupply: parseFloat(data.ctx.circulatingSupply),
          };

          const store = useWebSocketStore.getState();
          store.setAssetContext(coin, ctx);
          store.setPrice(coin, ctx.markPx.toString());
        });
        singleAssetCtxSubRef.current = sub;
      }
    } catch (error) {
      console.error('[Phase 4] [ChartMode] Error subscribing single asset ctx:', error);
    }
  }, [unsubscribeSingleAssetCtx]);

  const resubscribeGlobal = useCallback(async (): Promise<void> => {
    const client = subscriptionClientRef.current;
    if (!client) return;
    console.log('[Phase 4] Restoring global subscriptions (allMids + all asset contexts)');

    // Re-subscribe allMids for default dex
    try {
      const sub = await client.allMids((data: any) => {
        const priceMap: Record<string, string> = {};
        if (data.mids && typeof data.mids === 'object') {
          Object.entries(data.mids).forEach(([coin, price]) => {
            if (typeof price === 'string') {
              if (coin.startsWith('@')) {
                const spotIndex = parseInt(coin.substring(1), 10);
                const spotMarket = spotMarketsRef.current.find(
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
        Object.assign(pendingPricesRef.current, priceMap);
        scheduleBatchFlush();
      });
      allMidsSubIdRef.current = sub;
    } catch (error) {
      console.error('[Phase 4] Error restoring allMids:', error);
    }

    // Re-subscribe allMids for HIP-3 dexes
    try {
      const hip3MidsSubs = await Promise.all(
        HIP3_DEXES.map(async (dex) => {
          try {
            const sub = await client.allMids({ dex }, (data: any) => {
              const priceMap: Record<string, string> = {};
              const newContexts: Record<string, AssetContext> = {};

              if (data.mids && typeof data.mids === 'object') {
                Object.entries(data.mids).forEach(([coin, price]) => {
                  if (typeof price === 'string') {
                    const parts = coin.split(':');
                    const symbol = parts.length > 1 ? parts[1] : coin;

                    // Store ALL HIP-3 prices (no whitelist filter)
                    const key = `${dex}:${symbol}`;
                    priceMap[key] = price;

                    const existingMarket = perpMarketsRef.current.find(
                      m => m.name === symbol && m.dex === dex
                    );

                    if (existingMarket) {
                      newContexts[key] = {
                        ...getWebSocketState().assetContexts[key],
                        markPx: parseFloat(price),
                      } as AssetContext;
                    } else {
                      const newMarket = createHIP3Market(dex, symbol);
                      useWebSocketStore.getState().addPerpMarket(newMarket);
                      perpMarketsRef.current = [...perpMarketsRef.current, newMarket];

                      newContexts[key] = {
                        markPx: parseFloat(price),
                        dayNtlVlm: 0,
                        prevDayPx: parseFloat(price),
                        funding: 0,
                        openInterest: 0,
                      };
                    }
                  }
                });
              }
              Object.assign(pendingPricesRef.current, priceMap);
              Object.assign(pendingContextsRef.current, newContexts);
              scheduleBatchFlush();
            });
            return sub;
          } catch (error) {
            console.error(`[HIP-3] Error restoring allMids for ${dex}:`, error);
            return null;
          }
        })
      );
      allMidsSubIdsRef.current = hip3MidsSubs.filter((sub) => sub !== null);
    } catch (error) {
      console.error('[HIP-3] Error restoring HIP-3 allMids:', error);
    }

    // Re-subscribe asset contexts for all markets
    try {
      const perpSubs = await Promise.all(
        perpMarketsRef.current.map(async (market) => {
          try {
            const subscriptionCoin = market.dex
              ? `${market.dex}:${market.name}`
              : market.name;

            const sub = await client.activeAssetCtx(
              { coin: subscriptionCoin },
              (data: any) => {
                const ctx: AssetContext = {
                  dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                  prevDayPx: parseFloat(data.ctx.prevDayPx),
                  markPx: parseFloat(data.ctx.markPx),
                  midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                  funding: parseFloat(data.ctx.funding),
                  openInterest: parseFloat(data.ctx.openInterest),
                };

                const contextKey = market.dex ? `${market.dex}:${market.name}` : market.name;

                pendingContextsRef.current[contextKey] = ctx;
                scheduleBatchFlush();
              }
            );
            return sub;
          } catch (error) {
            const dexInfo = market.dex ? ` (${market.dex})` : '';
            console.error(`[Phase 4] Error re-subscribing perp ${market.name}${dexInfo}:`, error);
            return null;
          }
        })
      );
      allPerpAssetCtxSubsRef.current = perpSubs.filter((sub) => sub !== null);

      const spotSubs = await Promise.all(
        spotMarketsRef.current.map(async (market) => {
          try {
            const subscriptionCoin =
              market.name === 'PURR/USDC' ? 'PURR/USDC' : `@${market.index}`;
            const sub = await (client as any).activeSpotAssetCtx(
              { coin: subscriptionCoin },
              (data: any) => {
                const ctx: AssetContext = {
                  dayNtlVlm: parseFloat(data.ctx.dayNtlVlm),
                  prevDayPx: parseFloat(data.ctx.prevDayPx),
                  markPx: parseFloat(data.ctx.markPx),
                  midPx: data.ctx.midPx ? parseFloat(data.ctx.midPx) : undefined,
                  circulatingSupply: parseFloat(data.ctx.circulatingSupply),
                };

                pendingContextsRef.current[market.name] = ctx;
                scheduleBatchFlush();
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
  }, [scheduleBatchFlush]);

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

  // ============ BACKGROUND/FOREGROUND HANDLING ============
  useEffect(() => {
    // Don't do anything until initial subscriptions are complete
    if (!isInitializedRef.current) return;

    // Only handle global mode - chart mode has its own subscription management
    if (subscriptionModeRef.current !== 'global') return;

    if (!isAppActive) {
      // === APP WENT TO BACKGROUND ===
      console.log('[WebSocket] App backgrounded - pausing global subscriptions');

      // 1. Clear pending queues to avoid processing stale data on return
      pendingPricesRef.current = {};
      pendingContextsRef.current = {};

      // 2. Cancel any pending batch flush
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

      // 3. Unsubscribe from global subscriptions (allMids + asset contexts)
      unsubscribeAllMids();
      unsubscribeAllAssetCtx();
    } else {
      // === APP RETURNED TO FOREGROUND ===
      console.log('[WebSocket] App foregrounded - resuming global subscriptions');

      // Resubscribe to all global subscriptions
      resubscribeGlobal();
    }
  }, [isAppActive, unsubscribeAllMids, unsubscribeAllAssetCtx, resubscribeGlobal]);

  // Re-subscribe the single asset context when coin or market type changes during Chart Mode
  useEffect(() => {
    if (subscriptionModeRef.current !== 'chart') return;
    subscribeSingleAssetCtx();
  }, [storeState.selectedCoin, storeState.marketType, subscribeSingleAssetCtx]);

  // Build state object for backward compatibility
  const state: WebSocketState = {
    isConnected: storeState.isConnected,
    error: storeState.error,
    perpMarkets: storeState.perpMarkets,
    spotMarkets: storeState.spotMarkets,
    marketType: storeState.marketType,
    selectedCoin: storeState.selectedCoin,
    prices: storeState.prices,
    assetContexts: storeState.assetContexts,
    orderbook: storeState.orderbook,
    recentTrades: storeState.recentTrades,
  };

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

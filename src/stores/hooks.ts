import { useCallback } from 'react';
import { useWebSocketStore } from './websocketStore';
import type { MarketType, PerpMarket, SpotMarket, AssetContext, Orderbook, Trade } from '../types';

// ============ Connection Selectors ============

/**
 * Returns connection status. Only re-renders when isConnected changes.
 */
export const useIsConnected = (): boolean => {
  return useWebSocketStore((state) => state.isConnected);
};

/**
 * Returns error state. Only re-renders when error changes.
 */
export const useWebSocketError = (): string | null => {
  return useWebSocketStore((state) => state.error);
};

// ============ Market Selectors ============

/**
 * Returns perp markets array. Only re-renders when perpMarkets changes.
 */
export const usePerpMarkets = (): PerpMarket[] => {
  return useWebSocketStore((state) => state.perpMarkets);
};

/**
 * Returns spot markets array. Only re-renders when spotMarkets changes.
 */
export const useSpotMarkets = (): SpotMarket[] => {
  return useWebSocketStore((state) => state.spotMarkets);
};

/**
 * Returns current market type ('perp' | 'spot'). Only re-renders when marketType changes.
 */
export const useMarketType = (): MarketType => {
  return useWebSocketStore((state) => state.marketType);
};

/**
 * Returns currently selected coin. Only re-renders when selectedCoin changes.
 */
export const useSelectedCoin = (): string | null => {
  return useWebSocketStore((state) => state.selectedCoin);
};

/**
 * Returns markets based on current market type.
 * Only re-renders when the relevant market array or marketType changes.
 */
export const useCurrentMarkets = (): PerpMarket[] | SpotMarket[] => {
  const marketType = useWebSocketStore((state) => state.marketType);
  const perpMarkets = useWebSocketStore((state) => state.perpMarkets);
  const spotMarkets = useWebSocketStore((state) => state.spotMarkets);
  return marketType === 'perp' ? perpMarkets : spotMarkets;
};

// ============ Price Selectors ============

/**
 * Returns all prices. Use sparingly - prefer usePrice() for single coins.
 */
export const usePrices = (): Record<string, string> => {
  return useWebSocketStore((state) => state.prices);
};

/**
 * Returns price for a single coin. Only re-renders when THIS coin's price changes.
 * This is the most efficient way to get a single price.
 */
export const usePrice = (coin: string | null): string | undefined => {
  return useWebSocketStore(
    useCallback((state) => (coin ? state.prices[coin] : undefined), [coin])
  );
};

/**
 * Returns prices for multiple coins. Only re-renders when any of these prices change.
 */
export const usePricesForCoins = (coins: string[]): Record<string, string> => {
  return useWebSocketStore(
    useCallback(
      (state) => {
        const result: Record<string, string> = {};
        for (const coin of coins) {
          if (state.prices[coin] !== undefined) {
            result[coin] = state.prices[coin];
          }
        }
        return result;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [coins.join(',')]
    )
  );
};

// ============ Asset Context Selectors ============

/**
 * Returns all asset contexts. Use sparingly - prefer useAssetContext() for single coins.
 */
export const useAssetContexts = (): Record<string, AssetContext> => {
  return useWebSocketStore((state) => state.assetContexts);
};

/**
 * Returns asset context for a single coin. Only re-renders when THIS coin's context changes.
 */
export const useAssetContext = (coin: string | null): AssetContext | undefined => {
  return useWebSocketStore(
    useCallback((state) => (coin ? state.assetContexts[coin] : undefined), [coin])
  );
};

// ============ Orderbook Selectors ============

/**
 * Returns current orderbook. Only re-renders when orderbook changes.
 */
export const useOrderbook = (): Orderbook | null => {
  return useWebSocketStore((state) => state.orderbook);
};

// ============ Trades Selectors ============

/**
 * Returns recent trades array. Only re-renders when recentTrades changes.
 */
export const useRecentTrades = (): Trade[] => {
  return useWebSocketStore((state) => state.recentTrades);
};

// ============ Combined Selectors ============

/**
 * Returns selected coin data including price and context.
 * Useful for detail views that need multiple pieces of data.
 */
export const useSelectedCoinData = () => {
  const selectedCoin = useWebSocketStore((state) => state.selectedCoin);
  const marketType = useWebSocketStore((state) => state.marketType);
  const price = useWebSocketStore(
    useCallback((state) => (selectedCoin ? state.prices[selectedCoin] : undefined), [selectedCoin])
  );
  const context = useWebSocketStore(
    useCallback((state) => (selectedCoin ? state.assetContexts[selectedCoin] : undefined), [selectedCoin])
  );

  if (!selectedCoin) return null;

  return {
    coin: selectedCoin,
    price,
    context,
    marketType,
  };
};

/**
 * Returns market data for display (coin, price, context) for the current market type.
 * Optimized for list rendering.
 */
export const useMarketListData = () => {
  const marketType = useWebSocketStore((state) => state.marketType);
  const perpMarkets = useWebSocketStore((state) => state.perpMarkets);
  const spotMarkets = useWebSocketStore((state) => state.spotMarkets);
  const prices = useWebSocketStore((state) => state.prices);
  const assetContexts = useWebSocketStore((state) => state.assetContexts);

  const markets = marketType === 'perp' ? perpMarkets : spotMarkets;

  return markets.map((market) => {
    const key = 'dex' in market && market.dex ? `${market.dex}:${market.name}` : market.name;
    return {
      name: market.name,
      key,
      dex: 'dex' in market ? market.dex : undefined,
      price: prices[key],
      context: assetContexts[key],
    };
  });
};

// ============ Store Actions ============

/**
 * Returns store actions without subscribing to state.
 * Use this when you only need to dispatch actions.
 */
export const useWebSocketActions = () => {
  const store = useWebSocketStore.getState();
  return {
    setConnected: store.setConnected,
    setError: store.setError,
    setPerpMarkets: store.setPerpMarkets,
    setSpotMarkets: store.setSpotMarkets,
    setMarketType: store.setMarketType,
    setSelectedCoin: store.setSelectedCoin,
    addPerpMarket: store.addPerpMarket,
    setPrice: store.setPrice,
    setBatchPrices: store.setBatchPrices,
    setAssetContext: store.setAssetContext,
    setBatchAssetContexts: store.setBatchAssetContexts,
    setOrderbook: store.setOrderbook,
    setRecentTrades: store.setRecentTrades,
    addTrades: store.addTrades,
    initializeMarkets: store.initializeMarkets,
    reset: store.reset,
  };
};

// ============ Direct Store Access (for non-React code) ============

/**
 * Get current state directly (for use in callbacks, effects, etc.)
 */
export const getWebSocketState = () => useWebSocketStore.getState();

/**
 * Subscribe to state changes (for use outside React components)
 */
export const subscribeToWebSocketStore = useWebSocketStore.subscribe;

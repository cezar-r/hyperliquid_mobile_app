import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  MarketType,
  PerpMarket,
  SpotMarket,
  AssetContext,
  Orderbook,
  Trade,
} from '../types';

export interface WebSocketStoreState {
  // Connection
  isConnected: boolean;
  error: string | null;

  // Markets
  perpMarkets: PerpMarket[];
  spotMarkets: SpotMarket[];
  marketType: MarketType;
  selectedCoin: string | null;

  // Data (frequently updated)
  prices: Record<string, string>;
  assetContexts: Record<string, AssetContext>;
  orderbook: Orderbook | null;
  recentTrades: Trade[];

  // Timestamps for freshness tracking (prevents stale API data from overwriting newer WebSocket data)
  priceTimestamps: Record<string, number>;
  contextTimestamps: Record<string, number>;
}

export interface WebSocketStoreActions {
  // Connection actions
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;

  // Market actions
  setPerpMarkets: (markets: PerpMarket[]) => void;
  setSpotMarkets: (markets: SpotMarket[]) => void;
  setMarketType: (type: MarketType) => void;
  setSelectedCoin: (coin: string | null) => void;
  addPerpMarket: (market: PerpMarket) => void;

  // Price actions (optimized for batching)
  setPrice: (coin: string, price: string, timestamp?: number) => void;
  setBatchPrices: (prices: Record<string, string>, timestamp?: number) => void;

  // Asset context actions (optimized for batching)
  setAssetContext: (coin: string, ctx: AssetContext, timestamp?: number) => void;
  setBatchAssetContexts: (contexts: Record<string, AssetContext>, timestamp?: number) => void;

  // Orderbook actions
  setOrderbook: (orderbook: Orderbook | null) => void;
  clearPendingOrderbook: () => void;

  // Trades actions
  setRecentTrades: (trades: Trade[]) => void;
  addTrades: (trades: Trade[]) => void;

  // Bulk initialization
  initializeMarkets: (data: {
    perpMarkets: PerpMarket[];
    spotMarkets: SpotMarket[];
    assetContexts: Record<string, AssetContext>;
    marketType: MarketType;
    selectedCoin: string | null;
  }) => void;

  // Reset state
  reset: () => void;
}

export type WebSocketStore = WebSocketStoreState & WebSocketStoreActions;

const initialState: WebSocketStoreState = {
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
  priceTimestamps: {},
  contextTimestamps: {},
};

// Trade debouncing - batch multiple trade updates into single store update
let pendingTrades: Trade[] = [];
let tradeFlushTimeout: ReturnType<typeof setTimeout> | null = null;
const TRADE_DEBOUNCE_MS = 150;
const MAX_TRADES = 30;

// Orderbook debouncing - prevent flooding on background return
let pendingOrderbook: Orderbook | null = null;
let orderbookFlushTimeout: ReturnType<typeof setTimeout> | null = null;
const ORDERBOOK_DEBOUNCE_MS = 100; // Faster than trades (150ms) for responsiveness

export const useWebSocketStore = create<WebSocketStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Connection actions
    setConnected: (isConnected) => set({ isConnected }),
    setError: (error) => set({ error }),

    // Market actions
    setPerpMarkets: (markets) => set({ perpMarkets: markets }),
    setSpotMarkets: (markets) => set({ spotMarkets: markets }),
    setMarketType: (type) => set({ marketType: type }),
    setSelectedCoin: (coin) => set({ selectedCoin: coin, orderbook: null, recentTrades: [] }),
    addPerpMarket: (market) => set((state) => {
      // Only add if not already exists
      const exists = state.perpMarkets.some(
        m => m.name === market.name && m.dex === market.dex
      );
      if (exists) return state;
      return { perpMarkets: [...state.perpMarkets, market] };
    }),

    // Price actions - optimized for single updates (with timestamp tracking)
    setPrice: (coin, price, timestamp = Date.now()) => set((state) => {
      // Only update if this data is newer than what we have
      const existingTimestamp = state.priceTimestamps[coin] || 0;
      if (timestamp < existingTimestamp) {
        return state; // Skip stale data
      }
      return {
        prices: { ...state.prices, [coin]: price },
        priceTimestamps: { ...state.priceTimestamps, [coin]: timestamp },
      };
    }),

    // Price actions - optimized for batch updates (reduces re-renders, with timestamp tracking)
    setBatchPrices: (newPrices, timestamp = Date.now()) => set((state) => {
      const updatedPrices = { ...state.prices };
      const updatedTimestamps = { ...state.priceTimestamps };
      let hasChanges = false;

      for (const [key, value] of Object.entries(newPrices)) {
        const existingTimestamp = updatedTimestamps[key] || 0;
        // Only update if this data is newer
        if (timestamp >= existingTimestamp) {
          updatedPrices[key] = value;
          updatedTimestamps[key] = timestamp;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return state; // No updates needed
      }

      return {
        prices: updatedPrices,
        priceTimestamps: updatedTimestamps,
      };
    }),

    // Asset context actions - single update (with timestamp tracking)
    setAssetContext: (coin, ctx, timestamp = Date.now()) => set((state) => {
      // Only update if this data is newer than what we have
      const existingTimestamp = state.contextTimestamps[coin] || 0;
      if (timestamp < existingTimestamp) {
        return state; // Skip stale data
      }
      return {
        assetContexts: { ...state.assetContexts, [coin]: ctx },
        contextTimestamps: { ...state.contextTimestamps, [coin]: timestamp },
      };
    }),

    // Asset context actions - batch update (reduces re-renders, with timestamp tracking)
    setBatchAssetContexts: (contexts, timestamp = Date.now()) => set((state) => {
      const updatedContexts = { ...state.assetContexts };
      const updatedTimestamps = { ...state.contextTimestamps };
      let hasChanges = false;

      for (const [key, value] of Object.entries(contexts)) {
        const existingTimestamp = updatedTimestamps[key] || 0;
        // Only update if this data is newer
        if (timestamp >= existingTimestamp) {
          updatedContexts[key] = value;
          updatedTimestamps[key] = timestamp;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return state; // No updates needed
      }

      return {
        assetContexts: updatedContexts,
        contextTimestamps: updatedTimestamps,
      };
    }),

    // Orderbook actions - debounced to prevent flooding on background return
    setOrderbook: (orderbook) => {
      pendingOrderbook = orderbook;
      if (!orderbookFlushTimeout) {
        orderbookFlushTimeout = setTimeout(() => {
          if (pendingOrderbook) {
            set({ orderbook: pendingOrderbook });
            pendingOrderbook = null;
          }
          orderbookFlushTimeout = null;
        }, ORDERBOOK_DEBOUNCE_MS);
      }
    },
    clearPendingOrderbook: () => {
      pendingOrderbook = null;
      if (orderbookFlushTimeout) {
        clearTimeout(orderbookFlushTimeout);
        orderbookFlushTimeout = null;
      }
    },

    // Trades actions
    setRecentTrades: (trades) => {
      // Clear pending trades when setting trades directly (e.g., on unsubscribe)
      pendingTrades = [];
      if (tradeFlushTimeout) {
        clearTimeout(tradeFlushTimeout);
        tradeFlushTimeout = null;
      }
      set({ recentTrades: trades });
    },
    addTrades: (newTrades) => {
      // Accumulate trades in buffer
      pendingTrades = [...newTrades, ...pendingTrades];

      // Debounce the store update
      if (!tradeFlushTimeout) {
        tradeFlushTimeout = setTimeout(() => {
          const tradesToFlush = pendingTrades;
          pendingTrades = [];
          tradeFlushTimeout = null;

          set((state) => {
            const combined = [...tradesToFlush, ...state.recentTrades].slice(0, MAX_TRADES);
            return { recentTrades: combined };
          });
        }, TRADE_DEBOUNCE_MS);
      }
    },

    // Bulk initialization - single state update for all initial data
    initializeMarkets: (data) => set({
      perpMarkets: data.perpMarkets,
      spotMarkets: data.spotMarkets,
      assetContexts: data.assetContexts,
      marketType: data.marketType,
      selectedCoin: data.selectedCoin,
    }),

    // Reset to initial state
    reset: () => set(initialState),
  }))
);


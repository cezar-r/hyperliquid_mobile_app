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
  setPrice: (coin: string, price: string) => void;
  setBatchPrices: (prices: Record<string, string>) => void;

  // Asset context actions (optimized for batching)
  setAssetContext: (coin: string, ctx: AssetContext) => void;
  setBatchAssetContexts: (contexts: Record<string, AssetContext>) => void;

  // Orderbook actions
  setOrderbook: (orderbook: Orderbook | null) => void;

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
};

// Trade debouncing - batch multiple trade updates into single store update
let pendingTrades: Trade[] = [];
let tradeFlushTimeout: ReturnType<typeof setTimeout> | null = null;
const TRADE_DEBOUNCE_MS = 150;
const MAX_TRADES = 30;

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

    // Price actions - optimized for single updates
    setPrice: (coin, price) => set((state) => ({
      prices: { ...state.prices, [coin]: price },
    })),

    // Price actions - optimized for batch updates (reduces re-renders)
    setBatchPrices: (newPrices) => set((state) => ({
      prices: { ...state.prices, ...newPrices },
    })),

    // Asset context actions - single update
    setAssetContext: (coin, ctx) => set((state) => ({
      assetContexts: { ...state.assetContexts, [coin]: ctx },
    })),

    // Asset context actions - batch update (reduces re-renders)
    setBatchAssetContexts: (contexts) => set((state) => ({
      assetContexts: { ...state.assetContexts, ...contexts },
    })),

    // Orderbook actions
    setOrderbook: (orderbook) => set({ orderbook }),

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


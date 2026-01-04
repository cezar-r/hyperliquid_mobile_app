// Zustand stores
export { useWebSocketStore } from './websocketStore';
export type { WebSocketStore, WebSocketStoreState, WebSocketStoreActions } from './websocketStore';

// Selector hooks
export {
  // Connection
  useIsConnected,
  useWebSocketError,
  // Markets
  usePerpMarkets,
  useSpotMarkets,
  useMarketType,
  useSelectedCoin,
  useCurrentMarkets,
  // Prices
  usePrices,
  usePrice,
  usePricesForCoins,
  // Asset Contexts
  useAssetContexts,
  useAssetContext,
  // Orderbook & Trades
  useOrderbook,
  useRecentTrades,
  // Combined
  useSelectedCoinData,
  useMarketListData,
  // Actions
  useWebSocketActions,
  // Direct access
  getWebSocketState,
  subscribeToWebSocketStore,
} from './hooks';

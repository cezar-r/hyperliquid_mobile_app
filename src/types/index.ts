/**
 * Shared TypeScript types and interfaces for the application.
 */

export type MarketType = 'perp' | 'spot';

export type WalletType = 'walletconnect' | 'injected';

export interface WalletInfo {
  address: string | null;
  type: WalletType | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface AccountData {
  perpPositions: any[];
  perpMarginSummary: {
    accountValue?: string;
    totalMarginUsed?: string;
    totalNtlPos?: string;
    totalRawUsd?: string;
    withdrawable?: string;
  };
  spotBalances: Array<{
    coin: string;
    hold: string;
    token: number;
    total: string;
  }>;
  openOrders: any[];
  userFills: any[];
}

export interface AccountState {
  data: AccountData | null;
  isLoading: boolean;
  error: string | null;
}

export interface PerpMarket {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export interface SpotMarket {
  name: string;
  tokens: [number, number];
  index: number;
  isCanonical?: boolean;
}

export interface AssetContext {
  dayNtlVlm: number;
  prevDayPx: number;
  markPx: number;
  midPx?: number;
  funding?: number;
  openInterest?: number;
  circulatingSupply?: number;
}

export interface OrderbookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface Orderbook {
  coin: string;
  time: number;
  levels: [OrderbookLevel[], OrderbookLevel[]];
}

export interface Trade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
}

export interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  perpMarkets: PerpMarket[];
  spotMarkets: SpotMarket[];
  marketType: MarketType;
  selectedCoin: string | null;
  prices: Record<string, string>;
  assetContexts: Record<string, AssetContext>;
  orderbook: Orderbook | null;
  recentTrades: Trade[];
}


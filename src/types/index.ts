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

export interface PerpPosition {
  coin: string;
  szi: string; // position size (signed, negative for short)
  entryPx: string;
  positionValue?: string;
  unrealizedPnl?: string;
  returnOnEquity?: string;
  leverage?: {
    type: string;
    value: number;
    rawUsd?: string;
  };
  liquidationPx?: string | null;
  marginUsed?: string;
  tpPrice?: number | null;
  slPrice?: number | null;
  tpOrderId?: number | null;
  slOrderId?: number | null;
}

export interface SpotBalance {
  coin: string;
  hold: string;
  token: number;
  total: string;
}

export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition?: string;
  dir?: string;
  closedPnl?: string;
  hash?: string;
  oid?: number;
  crossed?: boolean;
  fee?: string;
  tid?: number;
  feeToken?: string;
}

export interface OpenOrder {
  coin: string;
  side: string;
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  triggerPx?: string;
  orderType?: string;
}

export interface StakingSummary {
  delegated: string;
  undelegated: string;
  totalPendingWithdrawal: string;
  nPendingWithdrawals: number;
}

export interface StakingDelegation {
  validator: `0x${string}`;
  amount: string;
  lockedUntilTimestamp: number;
}

export interface StakingReward {
  time: number;
  source: 'delegation' | 'commission';
  totalAmount: string;
}

export interface AccountData {
  perpPositions: PerpPosition[];
  perpMarginSummary: {
    accountValue?: string;
    totalMarginUsed?: string;
    totalNtlPos?: string;
    totalRawUsd?: string;
    withdrawable?: string;
  };
  spotBalances: SpotBalance[];
  openOrders: OpenOrder[];
  userFills: UserFill[];
  stakingDelegations: StakingDelegation[];
  stakingSummary: StakingSummary | null;
  stakingRewards: StakingReward[];
  lastUpdated?: number;
}

export interface AccountState {
  data: AccountData | null;
  isLoading: boolean;
  error: string | null;
}

export interface PerpMarket {
  name: string;
  index: number;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export interface SpotMarket {
  name: string;
  tokens: [number, number];
  index: number;
  szDecimals: number;
  isCanonical?: boolean;
  apiName?: string; // Format: @{index}, used by API for spot orders
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

export interface Candle {
  t: number;
  T: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  n: number;
}

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

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

export interface LedgerUpdate {
  time: number;
  hash: string;
  delta:
    | { type: 'deposit'; usdc: string }
    | { type: 'withdraw'; usdc: string; nonce: number; fee: string }
    | { type: 'accountClassTransfer'; usdc: string; toPerp: boolean }
    | { type: 'spotTransfer'; token: string; amount: string; user: string; destination: string; fee: string; usdcValue: string }
    | { type: 'internalTransfer'; usdc: string; user: string; destination: string; fee: string };
}


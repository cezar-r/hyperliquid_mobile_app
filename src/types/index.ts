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
  spotBalances: any[];
  openOrders: any[];
  userFills: any[];
  perpMarginSummary: any;
  isLoading: boolean;
  error: string | null;
}


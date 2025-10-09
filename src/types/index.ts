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


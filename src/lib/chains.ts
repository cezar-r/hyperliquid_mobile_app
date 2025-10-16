/**
 * Arbitrum chain configurations for deposits
 */

export interface ChainInfo {
  id: number;
  name: string;
  rpcUrls: string[];
  blockExplorers: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const ARBITRUM_ONE: ChainInfo = {
  id: 42161,
  name: 'Arbitrum One',
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorers: ['https://arbiscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const ARBITRUM_SEPOLIA: ChainInfo = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorers: ['https://sepolia.arbiscan.io'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};


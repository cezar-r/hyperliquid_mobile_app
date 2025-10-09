import { createWalletClient, custom } from 'viem';
import type { WalletClient } from 'viem';

export interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    callback: (...args: unknown[]) => void
  ) => void;
}

export async function requestAccounts(
  provider: WalletProvider
): Promise<string | null> {
  try {
    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('[Wallet] Failed to request accounts:', error);
    throw error;
  }
}

export function createViemWalletClient(
  address: string,
  provider: WalletProvider
): WalletClient {
  const walletClient = createWalletClient({
    account: address as `0x${string}`,
    chain: {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://rpc.ankr.com/eth'] },
      },
    },
    transport: custom(provider),
  });

  return walletClient;
}

export function onAccountsChanged(
  provider: WalletProvider,
  callback: (accounts: string[]) => void
): void {
  if (provider.on) {
    provider.on('accountsChanged', callback as (...args: unknown[]) => void);
  }
}

export function onChainChanged(
  provider: WalletProvider,
  callback: (chainId: string) => void
): void {
  if (provider.on) {
    provider.on('chainChanged', callback as (...args: unknown[]) => void);
  }
}

export function removeAccountsChangedListener(
  provider: WalletProvider,
  callback: (accounts: string[]) => void
): void {
  if (provider.removeListener) {
    provider.removeListener(
      'accountsChanged',
      callback as (...args: unknown[]) => void
    );
  }
}

export function removeChainChangedListener(
  provider: WalletProvider,
  callback: (chainId: string) => void
): void {
  if (provider.removeListener) {
    provider.removeListener(
      'chainChanged',
      callback as (...args: unknown[]) => void
    );
  }
}


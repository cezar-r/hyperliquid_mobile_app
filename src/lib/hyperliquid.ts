/**
 * Hyperliquid client initialization and transport utilities.
 * Creates HTTP and WebSocket transports with appropriate configuration.
 */

import * as hl from '@nktkas/hyperliquid';
import { isTestnet } from './config';

export function createHttpTransport(): hl.HttpTransport {
  return new hl.HttpTransport({
    isTestnet: isTestnet(),
    timeout: 10_000,
  });
}

export function createWebSocketTransport(): hl.WebSocketTransport {
  return new hl.WebSocketTransport({
    isTestnet: isTestnet(),
    timeout: 10_000,
    keepAliveInterval: 30_000,
    reconnect: {
      maxRetries: 10,
      connectionTimeout: 10_000,
    },
    resubscribe: true,
  });
}

export function createInfoClient(
  transport?: hl.HttpTransport | hl.WebSocketTransport
): hl.InfoClient {
  return new hl.InfoClient({
    transport: transport || createHttpTransport(),
  });
}

export function createSubscriptionClient(
  transport?: hl.WebSocketTransport
): hl.SubscriptionClient {
  return new hl.SubscriptionClient({
    transport: transport || createWebSocketTransport(),
  });
}

export function createExchangeClient(
  wallet: any,
  transport?: hl.HttpTransport | hl.WebSocketTransport,
  dex?: string
): hl.ExchangeClient {
  const config: any = {
    wallet,
    transport: transport || createHttpTransport(),
  };
  
  // Add dex parameter if specified (for HIP-3 dexes)
  if (dex) {
    config.dex = dex;
    console.log(`[Hyperliquid] Creating ExchangeClient for dex: ${dex}`);
  }
  
  return new hl.ExchangeClient(config);
}

/**
 * Helper to get an exchange client for a specific dex.
 * If dex is empty/undefined, returns the base exchange client.
 * For HIP-3 dexes, creates a new client configured for that dex.
 */
export function getDexExchangeClient(
  baseClient: hl.ExchangeClient | null,
  wallet: any,
  dex?: string
): hl.ExchangeClient | null {
  if (!baseClient) return null;
  
  // For default dex, use the base client
  if (!dex) return baseClient;
  
  // For HIP-3 dexes, create a dex-specific client
  console.log(`[Hyperliquid] Creating dex-specific client for: ${dex}`);
  return createExchangeClient(wallet, undefined, dex);
}

/**
 * Enable HIP-3 DEX abstraction for a user.
 * This allows trading on HIP-3 dexes by automatically transferring collateral.
 *
 * Note: DEX abstraction is a one-time setup that allows the user to trade on
 * HIP-3 dexes without manually transferring collateral for each trade.
 *
 * If this function fails, the user may need to enable DEX abstraction manually
 * via the Hyperliquid web interface at https://app.hyperliquid.xyz
 */
export async function enableHip3DexAbstraction(
  exchangeClient: hl.ExchangeClient,
  userAddress: string,
  enabled: boolean = true
): Promise<boolean> {
  try {
    console.log(`[HIP-3] Attempting to enable DEX abstraction for user: ${userAddress}`);

    // Try using the SDK's setDexAbstraction method if available
    const clientAny = exchangeClient as any;

    if (typeof clientAny.setDexAbstraction === 'function') {
      const result = await clientAny.setDexAbstraction({ enabled });
      console.log('[HIP-3] ✓ DEX abstraction enabled via SDK method:', result);
      return true;
    }

    // Try using a generic action method if available
    if (typeof clientAny.action === 'function') {
      const result = await clientAny.action({
        type: 'userEnableDexAbstraction',
        enabled,
      });
      console.log('[HIP-3] ✓ DEX abstraction enabled via action method:', result);
      return true;
    }

    // SDK doesn't have native support - log warning
    console.warn('[HIP-3] SDK does not have native DEX abstraction support');
    console.warn('[HIP-3] User may need to enable DEX abstraction manually at https://app.hyperliquid.xyz');
    console.warn('[HIP-3] HIP-3 trading will still work if already enabled via web interface');

    return false;
  } catch (error: any) {
    // Check if the error indicates it's already enabled
    if (error?.message?.includes('already') || error?.message?.includes('enabled')) {
      console.log('[HIP-3] DEX abstraction appears to already be enabled');
      return true;
    }

    console.error('[HIP-3] Failed to enable DEX abstraction:', error?.message || error);
    console.warn('[HIP-3] If you want to trade on HIP-3 dexes (xyz, vntl), please enable DEX abstraction at https://app.hyperliquid.xyz');

    return false;
  }
}


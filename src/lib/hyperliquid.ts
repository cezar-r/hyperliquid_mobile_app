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
  transport?: hl.HttpTransport | hl.WebSocketTransport
): hl.ExchangeClient {
  return new hl.ExchangeClient({
    wallet,
    transport: transport || createHttpTransport(),
  });
}


/**
 * Environment configuration for Hyperliquid API endpoints.
 * Supports testnet and mainnet with optional URL overrides.
 */

export type Environment = 'testnet' | 'mainnet';

const DEFAULT_TESTNET_URL = 'https://api.hyperliquid-testnet.xyz';
const DEFAULT_MAINNET_URL = 'https://api.hyperliquid.xyz';

export function getEnvironment(): Environment {
  return 'mainnet';
}

export function isTestnet(): boolean {
  return getEnvironment() === 'testnet';
}

export function getApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_HL_API_URL;
  if (override) {
    return override;
  }
  return isTestnet() ? DEFAULT_TESTNET_URL : DEFAULT_MAINNET_URL;
}

export function getWebSocketUrl(): string {
  return `${getApiUrl()}/ws`;
}


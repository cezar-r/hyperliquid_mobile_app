/**
 * Formatting utilities for Hyperliquid orders
 * Based on SDK test utilities
 */

import { SPOT_TICKER_MAP, HIP3_COLLATERAL } from '../constants/constants';

/**
 * Round to N significant figures
 */
function toSignificantFigures(num: number, sigFigs: number): number {
  if (num === 0) return 0;
  
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const scale = Math.pow(10, sigFigs - magnitude - 1);
  return Math.round(num * scale) / scale;
}

/**
 * Convert float to wire format for Hyperliquid
 * Rounds to 5 significant figures and removes trailing zeros
 */
export function floatToWire(x: number): string {
  // Round to 5 significant figures (Hyperliquid standard)
  const rounded = toSignificantFigures(x, 5);
  
  // Convert to string with enough decimals
  const str = rounded.toFixed(8);
  
  // Remove trailing zeros
  let normalized = str.replace(/\.?0+$/, '');
  if (normalized === '-0') normalized = '0';
  
  return normalized;
}

/**
 * Format price for Hyperliquid orders
 * Rounds to 5 sig figs, then to max allowed decimals based on szDecimals
 * Special case: if price < $1, use max 6 decimals regardless of szDecimals
 * For perps: maxPriceDecimals = max(6 - szDecimals, 0)
 * For spot: maxPriceDecimals = max(8 - szDecimals, 0)
 */
export function formatPrice(price: number, szDecimals: number, isPerp: boolean = true): string {
  // First round to 5 significant figures
  const rounded = toSignificantFigures(price, 5);
  
  // Special case: if price < $1, use max 6 decimals (not szDecimals formula)
  // This prevents over-rounding on low-price coins after slippage
  let maxAllowedDecimals: number;
  if (price < 1) {
    maxAllowedDecimals = 6;
    console.log('[formatPrice] Price < $1, using 6 decimals max');
  } else {
    // Calculate max allowed decimals based on szDecimals
    const maxDecimals = isPerp ? 6 : 8;
    maxAllowedDecimals = Math.max(maxDecimals - szDecimals, 0);
  }
  
  // Round to max allowed decimals
  const fixedToDecimals = rounded.toFixed(maxAllowedDecimals);
  
  // Remove trailing zeros
  let normalized = fixedToDecimals.replace(/\.?0+$/, '');
  if (normalized === '-0') normalized = '0';
  
  console.log('[formatPrice]', { price, szDecimals, maxAllowedDecimals, rounded, fixedToDecimals, normalized });
  
  return normalized;
}

/**
 * Format size for Hyperliquid orders  
 * Rounds to szDecimals, then normalizes (removes trailing zeros)
 * Based on Python SDK's float_to_wire implementation
 * Special rule: if price < $1, use whole numbers only (no decimals)
 */
export function formatSize(size: number, szDecimals: number, price?: number): string {
  console.log('[formatSize] Input:', { size, szDecimals, price });
  
  // If price < $1, use whole numbers only (no decimals)
  if (price !== undefined && price < 1) {
    console.log('[formatSize] Price < $1, rounding to whole number');
    const rounded = Math.round(size).toString();
    console.log('[formatSize] Final result:', rounded);
    return rounded;
  }
  
  // First round to szDecimals
  const rounded = size.toFixed(szDecimals);
  console.log('[formatSize] Rounded to', szDecimals, 'decimals:', rounded);
  
  // Handle -0 edge case
  if (rounded === '-0' || rounded.startsWith('-0.0000')) {
    console.log('[formatSize] Detected -0, returning 0');
    return '0';
  }
  
  // Remove trailing zeros (normalize)
  let normalized = rounded.replace(/\.?0+$/, '');
  console.log('[formatSize] After removing trailing zeros:', normalized);
  
  console.log('[formatSize] Final result:', normalized);
  return normalized;
}

/**
 * Remove trailing zeros from a number string
 */
export function removeTrailingZeros(value: string): string {
  if (!value.includes('.')) return value;
  return value.replace(/\.?0+$/, '');
}

/**
 * Get display ticker name for spot tokens
 * Maps wrapped tokens (UBTC, USOL, etc.) to their display names (BTC, SOL, etc.)
 * Returns original ticker if not in map
 */
export function getDisplayTicker(ticker: string): string {
  // Handle ticker pairs (e.g., "UBTC/USDC" -> "BTC/USDC")
  if (ticker.includes('/')) {
    const [base, quote] = ticker.split('/');
    const mappedBase = (SPOT_TICKER_MAP as Record<string, string>)[base] || base;
    return `${mappedBase}/${quote}`;
  }
  
  // Handle single tickers
  return (SPOT_TICKER_MAP as Record<string, string>)[ticker] || ticker;
}

/**
 * Resolve spot ticker from API format (@{index}) or base token name to display format
 * @param coin - Either API format (@107) or base token name (HYPE)
 * @param spotMarkets - Array of spot markets
 * @returns Display ticker with mapping applied (e.g., "HYPE" or "BTC" for "UBTC")
 */
export function resolveSpotTicker(coin: string, spotMarkets: any[]): string {
  // If coin starts with @, it's API format - look up by apiName
  if (coin.startsWith('@')) {
    const market = spotMarkets.find(m => m.apiName === coin);
    if (market) {
      // Return the base token name with mapping applied
      const baseToken = market.baseToken || market.name.split('/')[0];
      return getDisplayTicker(baseToken);
    }
  }
  
  // Otherwise, it's already a token name - just apply mapping
  return getDisplayTicker(coin);
}

/**
 * Format number with commas (e.g., 1234.56 → 1,234.56)
 */
export function formatWithCommas(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Converts UTC timestamp (ms) to local timezone timestamp (seconds) for chart display
 * @param utcTimestampMs - UTC timestamp in milliseconds
 * @returns Local timezone timestamp in seconds
 */
export function convertUTCToLocalChartTime(utcTimestampMs: number): number {
  const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
  const localTimestampMs = utcTimestampMs - timezoneOffsetMs;
  return Math.floor(localTimestampMs / 1000);
}

/**
 * Get display name for HIP-3 markets with collateral suffix.
 * Returns format: "NAME - COLLATERAL" (e.g., "NVDA - USDC", "SPACEX - USDH")
 * For default dex (empty string), returns the name unchanged.
 *
 * @param name - Market name (e.g., "NVDA", "SPACEX")
 * @param dex - HIP-3 dex name (e.g., "xyz", "vntl") or empty string for default
 * @returns Display name with collateral suffix for HIP-3 markets
 */
export function getHip3DisplayName(name: string, dex: string): string {
  if (!dex) return name; // Default dex, no collateral suffix
  const collateral = HIP3_COLLATERAL[dex] || 'USD';
  return `${name}-${collateral}`;
}

/**
 * Get the collateral token symbol for a HIP-3 dex.
 * Returns 'USDC' for default dex or unknown dex.
 *
 * @param dex - HIP-3 dex name or empty string for default
 * @returns Collateral token symbol
 */
export function getHip3Collateral(dex: string): string {
  if (!dex) return 'USDC'; // Default dex uses USDC
  return HIP3_COLLATERAL[dex] || 'USDC';
}


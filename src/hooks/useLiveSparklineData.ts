/**
 * Hook that appends live WebSocket price to historical sparkline data.
 * This ensures sparklines always extend to "now" with the current price.
 */

import { useMemo } from 'react';
import { useSparklineDataOptional } from '../contexts/SparklineDataContext';
import { usePrice } from '../stores/hooks';
import type { SparklineData, SparklinePoint } from '../ui/shared/components/sparkline';
import type { MarketType } from '../types';

export interface LiveSparklineData extends SparklineData {
  hasLivePoint: boolean;
}

/**
 * Returns sparkline data with the current live price appended as the final point.
 *
 * This hook:
 * 1. Gets historical sparkline data from cache (24h of 15-min candles)
 * 2. Gets live price from WebSocket store
 * 3. Appends live price as final point with current timestamp
 * 4. Recalculates isPositive based on first point vs live price
 *
 * @param coin - The coin identifier (e.g., "BTC", "ETH", "xyz:NVDA")
 * @param marketType - Market type ('perp' or 'spot')
 * @param priceKey - Optional custom key for price lookup (for different price key format)
 */
export function useLiveSparklineData(
  coin: string,
  marketType: MarketType,
  priceKey?: string
): LiveSparklineData | null {
  const sparklineContext = useSparklineDataOptional();

  // Use custom priceKey if provided, otherwise use coin
  const effectivePriceKey = priceKey ?? coin;
  const livePrice = usePrice(effectivePriceKey);

  // Subscribe to cacheVersion to trigger re-renders when cache updates
  const cacheVersion = sparklineContext?.cacheVersion ?? 0;

  // Get base sparkline data
  const baseData = sparklineContext?.getSparklineData(coin, marketType) ?? null;

  return useMemo(() => {
    if (!baseData || baseData.points.length === 0) {
      return null;
    }

    // If no live price, return base data as-is
    if (!livePrice) {
      return {
        ...baseData,
        hasLivePoint: false,
      };
    }

    const livePriceNum = parseFloat(livePrice);
    if (!Number.isFinite(livePriceNum)) {
      return {
        ...baseData,
        hasLivePoint: false,
      };
    }

    const now = Date.now();
    const lastHistoricalPoint = baseData.points[baseData.points.length - 1];

    // Only append if live price timestamp is after last historical point
    if (lastHistoricalPoint && lastHistoricalPoint.timestamp >= now) {
      return {
        ...baseData,
        hasLivePoint: false,
      };
    }

    // Create new point with live data
    const livePoint: SparklinePoint = {
      timestamp: now,
      value: livePriceNum,
    };

    // Append live point to historical data
    const pointsWithLive = [...baseData.points, livePoint];

    // Recalculate isPositive based on first point vs live price
    const firstValue = baseData.points[0].value;
    const isPositive = livePriceNum >= firstValue;

    return {
      points: pointsWithLive,
      isPositive,
      lastUpdated: now,
      hasLivePoint: true,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseData, livePrice, cacheVersion]);
}

/**
 * Convenience function for getting the price key for a market.
 * Handles HIP-3 dex format (dex:coin) and spot market name resolution.
 */
export function getSparklinePriceKey(
  coin: string,
  marketType: MarketType,
  dex?: string
): string {
  if (marketType === 'perp' && dex) {
    return `${dex}:${coin}`;
  }
  return coin;
}

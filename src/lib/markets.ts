/**
 * Market metadata utilities for perp and spot markets.
 * Handles market loading, coin resolution, and market lookups.
 */

import * as hl from '@nktkas/hyperliquid';
import type { PerpMarket, SpotMarket, MarketType } from '../types';

export async function fetchPerpMarkets(
  infoClient: hl.InfoClient
): Promise<{ markets: PerpMarket[]; contexts: Record<string, any> }> {
  try {
    const [meta, assetCtxs] = await infoClient.metaAndAssetCtxs();
    
    const markets = meta.universe.map((market: any, index: number) => ({
      name: market.name,
      index: index, // Asset index for order placement
      szDecimals: market.szDecimals,
      maxLeverage: market.maxLeverage || 50,
      onlyIsolated: market.onlyIsolated || false,
    }));

    const contexts: Record<string, any> = {};
    assetCtxs.forEach((ctx: any, index: number) => {
      if (meta.universe[index]) {
        contexts[meta.universe[index].name] = ctx;
      }
    });

    return { markets, contexts };
  } catch (error) {
    console.error('[Markets] Failed to fetch perp markets:', error);
    return { markets: [], contexts: {} };
  }
}

export async function fetchSpotMarkets(
  infoClient: hl.InfoClient
): Promise<{ markets: SpotMarket[]; contexts: Record<string, any> }> {
  try {
    const [spotMeta, assetCtxs] = await infoClient.spotMetaAndAssetCtxs();
    
    const tokenMap = new Map(
      spotMeta.tokens.map((t: any) => [t.index, t])
    );
    
    const markets = spotMeta.universe.map((market: any) => {
      const baseTokenId = market.tokens[0];
      const quoteTokenId = market.tokens[1];
      const baseToken = tokenMap.get(baseTokenId);
      const quoteToken = tokenMap.get(quoteTokenId);
      
      let displayName = market.name;
      if (baseToken && quoteToken) {
        displayName = `${baseToken.name}/${quoteToken.name}`;
      }
      
      return {
        name: displayName,
        tokens: market.tokens,
        index: market.index,
        szDecimals: baseToken?.szDecimals || 0,
        isCanonical: market.isCanonical || false,
        baseToken: baseToken?.name,
        baseTokenIndex: baseTokenId,
        apiName: `@${market.index}`, // API format for spot orders
      };
    });

    // Map contexts by market display name
    // assetCtxs is an array indexed by token index
    const contexts: Record<string, any> = {};
    markets.forEach((market: any) => {
      const ctx = assetCtxs[market.baseTokenIndex];
      if (ctx) {
        contexts[market.name] = ctx;
      }
    });
    
    console.log('[Markets] Spot contexts mapped:', Object.keys(contexts).length, '/', markets.length);

    return { markets, contexts };
  } catch (error) {
    console.error('[Markets] Failed to fetch spot markets:', error);
    return { markets: [], contexts: {} };
  }
}

/**
 * Resolves display coin name to WebSocket subscription format.
 * 
 * For perps: uses coin name directly (e.g., "BTC")
 * For spot: uses @{universeIndex} format (e.g., "@0" for PURR/USDC)
 * 
 * Note: This is for subscriptions only. For orders, use resolveOrderAsset().
 */
export function resolveSubscriptionCoin(
  marketType: MarketType,
  displayCoin: string,
  spotMarkets: SpotMarket[]
): string {
  if (marketType === 'perp') {
    return displayCoin;
  }

  const spotMarket = spotMarkets.find((m) => m.name === displayCoin);
  if (spotMarket) {
    return `@${spotMarket.index}`;
  }

  return displayCoin;
}

/**
 * Resolves market to asset ID for order placement.
 * 
 * For perps: returns the coin index from meta (e.g., 0 for BTC)
 * For spot: returns 10000 + universeIndex (e.g., 10000 for PURR/USDC at index 0)
 * 
 * Examples:
 * - BTC perp (index 0): returns 0
 * - PURR/USDC spot (universe index 0): returns 10000
 * - HFUN/USDC spot (universe index 1): returns 10001
 */
export function resolveOrderAsset(
  marketType: MarketType,
  coinOrPair: string,
  perpMarkets: PerpMarket[],
  spotMarkets: SpotMarket[]
): number | null {
  if (marketType === 'perp') {
    const perpIndex = perpMarkets.findIndex((m) => m.name === coinOrPair);
    return perpIndex !== -1 ? perpIndex : null;
  }

  const spotMarket = spotMarkets.find((m) => m.name === coinOrPair);
  return spotMarket ? 10000 + spotMarket.index : null;
}

export function findPerpMarket(
  markets: PerpMarket[],
  coinName: string
): PerpMarket | undefined {
  return markets.find((m) => m.name === coinName);
}

export function findSpotMarket(
  markets: SpotMarket[],
  coinName: string
): SpotMarket | undefined {
  return markets.find((m) => m.name === coinName);
}

export function getDefaultCoin(
  marketType: MarketType,
  perpMarkets: PerpMarket[],
  spotMarkets: SpotMarket[]
): string | null {
  if (marketType === 'perp') {
    return perpMarkets.length > 0 ? perpMarkets[0].name : null;
  }
  return spotMarkets.length > 0 ? spotMarkets[0].name : null;
}


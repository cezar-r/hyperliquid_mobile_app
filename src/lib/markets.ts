/**
 * Market metadata utilities for perp and spot markets.
 * Handles market loading, coin resolution, and market lookups.
 */

import * as hl from '@nktkas/hyperliquid';
import type { PerpMarket, SpotMarket, MarketType } from '../types';
import { HIP3_DEXES, HIP3_SYMBOLS, calculateHip3AssetId } from '../constants/constants';

/**
 * Creates a PerpMarket entry for a HIP-3 dex symbol.
 * Used for dynamically adding markets that only exist in the allMids feed.
 *
 * Note: The index is set to -1 to indicate it needs to be fetched from meta.
 * For proper trading, markets should be loaded via fetchPerpMarkets() which
 * gets the correct index from the dex's meta API.
 */
export function createHIP3Market(dex: string, symbol: string, indexInMeta: number = -1): PerpMarket {
  return {
    name: symbol,
    index: indexInMeta, // Index within the dex's meta universe (-1 if unknown)
    szDecimals: 5, // Default, may need adjustment per symbol
    maxLeverage: 50,
    onlyIsolated: true, // HIP-3 markets are isolated-only
    dex: dex,
  };
}

export async function fetchPerpMarkets(
  infoClient: hl.InfoClient,
  dex: string = ''
): Promise<{ markets: PerpMarket[]; contexts: Record<string, any> }> {
  try {
    const [meta, assetCtxs] = await infoClient.metaAndAssetCtxs(dex ? { dex } : undefined);

    const markets = meta.universe.map((market: any, index: number) => {
      let name = market.name;

      // Strip dex prefix if present (HIP-3 API returns "dex:symbol" format)
      if (dex && name.startsWith(`${dex}:`)) {
        name = name.slice(dex.length + 1);
      }

      return {
        name,
        index, // Asset index for order placement
        szDecimals: market.szDecimals,
        maxLeverage: market.maxLeverage || 50,
        onlyIsolated: market.onlyIsolated || false,
        dex, // Track which dex this market belongs to
      };
    });

    const contexts: Record<string, any> = {};
    markets.forEach((market: PerpMarket) => {
      const ctx = assetCtxs[market.index];
      if (ctx) {
        // Use unique key for HIP-3 dexes: dex:coin
        const key = dex ? `${dex}:${market.name}` : market.name;
        contexts[key] = ctx;
      }
    });

    return { markets, contexts };
  } catch (error) {
    console.error(`[Markets] Failed to fetch perp markets for dex "${dex}":`, error);
    return { markets: [], contexts: {} };
  }
}

/**
 * Fetches markets from default dex only.
 * HIP-3 dex markets are created dynamically from allMids WebSocket data
 * since they don't appear in the meta API universe.
 */
export async function fetchAllDexMarkets(
  infoClient: hl.InfoClient
): Promise<{ markets: PerpMarket[]; contexts: Record<string, any> }> {
  try {
    console.log('[HIP-3] Fetching markets from all dexes...');
    
    // Fetch default + all HIP-3 dexes in parallel
    const results = await Promise.all([
      fetchPerpMarkets(infoClient, ''),      // default
      ...HIP3_DEXES.map(dex => fetchPerpMarkets(infoClient, dex))
    ]);
    
    // Combine all markets and contexts
    const allMarkets = results.flatMap(r => r.markets);
    const allContexts = {};
    results.forEach(result => Object.assign(allContexts, result.contexts));
    
    console.log(`[HIP-3] Total markets loaded: ${allMarkets.length}`);
    console.log(`[HIP-3] Markets by dex:`, {
      default: results[0].markets.length,
      ...Object.fromEntries(HIP3_DEXES.map((dex, idx) => [dex, results[idx + 1].markets.length]))
    });
    
    return { markets: allMarkets, contexts: allContexts };
  } catch (error) {
    console.error('[HIP-3] Failed to fetch markets:', error);
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

    // console.log(JSON.stringify(spotMeta, null, 2));
    
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
 * For spot: uses @{universeIndex} format (e.g., "@107" for HYPE/USDC)
 * Special case: PURR/USDC uses its literal name, not @{index} format
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

  // PURR/USDC is special - it uses its literal name, not @{index} format
  if (displayCoin === 'PURR/USDC') {
    return 'PURR/USDC';
  }

  const spotMarket = spotMarkets.find((m) => m.name === displayCoin);
  if (spotMarket) {
    return `@${spotMarket.index}`;
  }

  return displayCoin;
}

/**
 * Gets the unique context key for a market.
 * For default dex: returns coin name
 * For HIP-3 dex: returns "dex:coin"
 */
export function getMarketContextKey(market: PerpMarket): string {
  return market.dex ? `${market.dex}:${market.name}` : market.name;
}

/**
 * Gets the unique context key for a position with dex.
 */
export function getPositionContextKey(coin: string, dex?: string): string {
  return dex ? `${dex}:${coin}` : coin;
}

/**
 * Resolves market to asset ID for order placement.
 *
 * For default perps: returns the coin index from meta (e.g., 0 for SOL, 3 for BTC)
 * For HIP-3 perps: returns 100000 + (perpDexIndex * 10000) + indexInMeta
 * For spot: returns 10000 + universeIndex (e.g., 10000 for PURR/USDC at index 0)
 *
 * Examples:
 * - SOL perp (default, index 0): returns 0
 * - BTC perp (default, index 3): returns 3
 * - xyz:NVDA (HIP-3, dexIndex=1, metaIndex=0): returns 110000
 * - PURR/USDC spot (universe index 0): returns 10000
 */
export function resolveOrderAsset(
  marketType: MarketType,
  coinOrPair: string,
  perpMarkets: PerpMarket[],
  spotMarkets: SpotMarket[],
  dex?: string
): number | null {
  if (marketType === 'perp') {
    // Find the market, optionally filtering by dex
    const market = perpMarkets.find((m) => m.name === coinOrPair && m.dex === (dex || ''));

    if (!market) {
      console.warn(`[Markets] Could not find perp market: ${coinOrPair}, dex: ${dex || 'default'}`);
      return null;
    }

    // For HIP-3 markets, calculate the full asset ID
    if (market.dex && market.dex !== '') {
      const assetId = calculateHip3AssetId(market.dex, market.index);
      console.log(`[Markets] HIP-3 asset ID for ${market.dex}:${market.name}: ${assetId} (dex index + meta index ${market.index})`);
      return assetId;
    }

    // For default dex, use the raw index
    return market.index;
  }

  const spotMarket = spotMarkets.find((m) => m.name === coinOrPair);
  return spotMarket ? 10000 + spotMarket.index : null;
}

/**
 * Gets the asset ID for a PerpMarket directly.
 * Handles both default and HIP-3 markets.
 */
export function getAssetIdForMarket(market: PerpMarket): number {
  if (market.dex && market.dex !== '') {
    return calculateHip3AssetId(market.dex, market.index);
  }
  return market.index;
}

/**
 * Parses a market key that may be in "dex:coin" or "coin" format.
 * Returns { coin, dex } where dex is undefined for default markets.
 */
export function parseMarketKey(marketKey: string): { coin: string; dex: string | undefined } {
  if (marketKey.includes(':')) {
    const [dex, coin] = marketKey.split(':');
    return { coin, dex };
  }
  return { coin: marketKey, dex: undefined };
}

export function findPerpMarket(
  markets: PerpMarket[],
  coinName: string,
  dex?: string
): PerpMarket | undefined {
  return markets.find((m) => m.name === coinName && m.dex === (dex || ''));
}

/**
 * Finds a perp market by market key (supports "dex:coin" or "coin" format).
 */
export function findPerpMarketByKey(
  markets: PerpMarket[],
  marketKey: string
): PerpMarket | undefined {
  const { coin, dex } = parseMarketKey(marketKey);
  return markets.find((m) => m.name === coin && m.dex === (dex || ''));
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


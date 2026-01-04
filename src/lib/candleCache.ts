/**
 * SQLite-based cache for chart candles
 * Stores candles locally to enable instant chart loading on revisits
 */

import * as SQLite from 'expo-sqlite';
import type { CandleInterval, MarketType } from '../types';

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CachedEntry {
  ticker: string;
  market: MarketType;
  timeframe: CandleInterval;
  last_fetched_ts: number;
  candlesJSON: string;
}

const DB_NAME = 'candle_cache.db';
const TABLE_NAME = 'candle_cache';
const MAX_CACHE_ENTRIES = 100;

let db: SQLite.SQLiteDatabase | null = null;
let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

/**
 * Check if the database is ready for queries
 */
export function isCacheReady(): boolean {
  return dbReady && db !== null;
}

/**
 * Initialize the SQLite database and create the candle_cache table
 */
export async function initCandleCache(): Promise<void> {
  // Return existing promise if already initializing
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      const initStart = Date.now();
      db = await SQLite.openDatabaseAsync(DB_NAME);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          ticker TEXT NOT NULL,
          market TEXT NOT NULL,
          timeframe TEXT NOT NULL,
          last_fetched_ts INTEGER NOT NULL,
          candlesJSON TEXT NOT NULL,
          PRIMARY KEY (ticker, market, timeframe)
        );

        CREATE INDEX IF NOT EXISTS idx_last_fetched
        ON ${TABLE_NAME} (last_fetched_ts);
      `);

      dbReady = true;
      const initTime = Date.now() - initStart;
      console.log(`[CandleCache] Database initialized successfully (took ${initTime}ms)`);
    } catch (error) {
      console.error('[CandleCache] Error initializing database:', error);
      dbReady = false;
    }
  })();

  return dbInitPromise;
}

/**
 * Check if cached data is still within the valid interval window
 */
function isWithinInterval(
  lastFetchedTs: number,
  interval: CandleInterval,
  currentTime: number
): boolean {
  const timeDiff = currentTime - lastFetchedTs;
  
  const intervalWindows: Record<CandleInterval, number> = {
    '1m': 1 * 60 * 1000,       // 1 minute
    '5m': 5 * 60 * 1000,       // 5 minutes
    '15m': 15 * 60 * 1000,     // 15 minutes
    '1h': 60 * 60 * 1000,      // 1 hour
    '4h': 4 * 60 * 60 * 1000,  // 4 hours
    '1d': 24 * 60 * 60 * 1000, // 1 day
  };
  
  return timeDiff < intervalWindows[interval];
}

/**
 * Retrieve cached candles if they exist and are still fresh
 * Returns null immediately if database is not ready (non-blocking)
 */
export async function getCachedCandles(
  ticker: string,
  market: MarketType,
  timeframe: CandleInterval
): Promise<ChartData[] | null> {
  // Return immediately if DB is not ready - don't block the caller
  if (!dbReady || !db) {
    return null;
  }

  try {
    const startTime = Date.now();
    const currentTime = Date.now();

    const result = await db.getFirstAsync<CachedEntry>(
      `SELECT * FROM ${TABLE_NAME} WHERE ticker = ? AND market = ? AND timeframe = ?`,
      [ticker, market, timeframe]
    );

    const queryTime = Date.now() - startTime;

    if (!result) {
      console.log(`[CandleCache] No cache for ${ticker} ${timeframe} (${queryTime}ms)`);
      return null;
    }

    // Check if cache is still fresh
    if (!isWithinInterval(result.last_fetched_ts, timeframe, currentTime)) {
      const age = Math.round((currentTime - result.last_fetched_ts) / 1000);
      console.log(`[CandleCache] Stale cache for ${ticker} ${timeframe} (${age}s old)`);
      return null;
    }

    const candles: ChartData[] = JSON.parse(result.candlesJSON);
    console.log(`[CandleCache] ✓ Cache hit: ${ticker} ${timeframe} (${candles.length} candles, ${queryTime}ms)`);

    return candles;
  } catch (error) {
    console.error('[CandleCache] Error retrieving cached candles:', error);
    return null;
  }
}

/**
 * Retrieve cached candles regardless of freshness (for fallback scenarios)
 * Returns { candles, lastFetchedTs, isStale } or null if no cache exists
 */
export async function getStaleCachedCandles(
  ticker: string,
  market: MarketType,
  timeframe: CandleInterval
): Promise<{ candles: ChartData[]; lastFetchedTs: number; isStale: boolean } | null> {
  if (!dbReady || !db) {
    return null;
  }

  try {
    const currentTime = Date.now();

    const result = await db.getFirstAsync<CachedEntry>(
      `SELECT * FROM ${TABLE_NAME} WHERE ticker = ? AND market = ? AND timeframe = ?`,
      [ticker, market, timeframe]
    );

    if (!result) {
      return null;
    }

    const candles: ChartData[] = JSON.parse(result.candlesJSON);
    const isStale = !isWithinInterval(result.last_fetched_ts, timeframe, currentTime);

    console.log(`[CandleCache] Stale cache lookup: ${ticker} ${timeframe} (${candles.length} candles, stale: ${isStale})`);

    return {
      candles,
      lastFetchedTs: result.last_fetched_ts,
      isStale,
    };
  } catch (error) {
    console.error('[CandleCache] Error retrieving stale cached candles:', error);
    return null;
  }
}

/**
 * Store or update candles in the cache
 * Only stores the latest 800 candles to keep cache size reasonable
 */
export async function setCachedCandles(
  ticker: string,
  market: MarketType,
  timeframe: CandleInterval,
  candles: ChartData[]
): Promise<void> {
  if (!dbReady || !db) {
    return;
  }

  try {
    const startTime = Date.now();
    const currentTime = Date.now();

    // Only cache the latest 800 candles to keep cache size reasonable and fast
    const candlesToCache = candles.slice(-800);
    const candlesJSON = JSON.stringify(candlesToCache);

    // Use REPLACE to insert or update
    await db.runAsync(
      `REPLACE INTO ${TABLE_NAME} (ticker, market, timeframe, last_fetched_ts, candlesJSON) VALUES (?, ?, ?, ?, ?)`,
      [ticker, market, timeframe, currentTime, candlesJSON]
    );

    const writeTime = Date.now() - startTime;
    console.log(`[CandleCache] ✓ Cached ${candlesToCache.length}/${candles.length} candles for ${ticker} ${timeframe} (${writeTime}ms)`);

    // Trigger cleanup to ensure we don't exceed max entries (async, don't await)
    cleanupOldCache().catch(err => console.error('[CandleCache] Cleanup error:', err));
  } catch (error) {
    console.error('[CandleCache] Error setting cached candles:', error);
  }
}

/**
 * Remove oldest cache entries when exceeding the max limit
 */
async function cleanupOldCache(): Promise<void> {
  if (!db) return;
  
  try {
    // Count total entries
    const countResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
    );
    
    const totalEntries = countResult?.count || 0;
    
    if (totalEntries <= MAX_CACHE_ENTRIES) {
      return; // No cleanup needed
    }
    
    const entriesToRemove = totalEntries - MAX_CACHE_ENTRIES;
    
    // Delete oldest entries
    await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE rowid IN (
        SELECT rowid FROM ${TABLE_NAME} ORDER BY last_fetched_ts ASC LIMIT ?
      )`,
      [entriesToRemove]
    );
    
    console.log(`[CandleCache] Cleaned up ${entriesToRemove} old cache entries`);
  } catch (error) {
    console.error('[CandleCache] Error during cleanup:', error);
  }
}

/**
 * Clear all cached candles (useful for debugging/testing)
 */
export async function clearAllCache(): Promise<void> {
  if (!db) {
    console.warn('[CandleCache] Database not initialized');
    return;
  }
  
  try {
    await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
    console.log('[CandleCache] All cache cleared');
  } catch (error) {
    console.error('[CandleCache] Error clearing cache:', error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSizeBytes: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  if (!db) {
    return { totalEntries: 0, totalSizeBytes: 0, oldestEntry: null, newestEntry: null };
  }

  try {
    const countResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
    );

    const sizeResult = await db.getFirstAsync<{ totalSize: number }>(
      `SELECT COALESCE(SUM(LENGTH(candlesJSON)), 0) as totalSize FROM ${TABLE_NAME}`
    );

    const oldestResult = await db.getFirstAsync<{ last_fetched_ts: number }>(
      `SELECT last_fetched_ts FROM ${TABLE_NAME} ORDER BY last_fetched_ts ASC LIMIT 1`
    );

    const newestResult = await db.getFirstAsync<{ last_fetched_ts: number }>(
      `SELECT last_fetched_ts FROM ${TABLE_NAME} ORDER BY last_fetched_ts DESC LIMIT 1`
    );

    return {
      totalEntries: countResult?.count || 0,
      totalSizeBytes: sizeResult?.totalSize || 0,
      oldestEntry: oldestResult?.last_fetched_ts || null,
      newestEntry: newestResult?.last_fetched_ts || null,
    };
  } catch (error) {
    console.error('[CandleCache] Error getting cache stats:', error);
    return { totalEntries: 0, totalSizeBytes: 0, oldestEntry: null, newestEntry: null };
  }
}


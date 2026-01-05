/**
 * SQLite-based cache for sparkline data
 * Stores sparkline points locally to enable instant loading on app reopens
 * Data expires after 24 hours
 */

import * as SQLite from 'expo-sqlite';
import type { MarketType } from '../types';
import type { SparklineData, SparklinePoint } from '../ui/shared/components/sparkline';

// Re-export types for convenience
export type { SparklineData, SparklinePoint };

interface CachedSparklineEntry {
  coin: string;
  market: MarketType;
  last_fetched_ts: number;
  pointsJSON: string;
  is_positive: number; // SQLite doesn't have boolean, use 0/1
}

const DB_NAME = 'sparkline_cache.db';
const TABLE_NAME = 'sparkline_cache';
const MAX_CACHE_ENTRIES = 200;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

let db: SQLite.SQLiteDatabase | null = null;
let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

/**
 * Check if the database is ready for queries
 */
export function isSparklineCacheReady(): boolean {
  return dbReady && db !== null;
}

/**
 * Initialize the SQLite database and create the sparkline_cache table
 */
export async function initSparklineCache(): Promise<void> {
  // Return existing promise if already initializing
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          coin TEXT NOT NULL,
          market TEXT NOT NULL,
          last_fetched_ts INTEGER NOT NULL,
          pointsJSON TEXT NOT NULL,
          is_positive INTEGER NOT NULL,
          PRIMARY KEY (coin, market)
        );

        CREATE INDEX IF NOT EXISTS idx_sparkline_last_fetched
        ON ${TABLE_NAME} (last_fetched_ts);
      `);

      dbReady = true;

      // Trigger initial cleanup (async, don't block)
      cleanupExpiredCache().catch(() => {});
    } catch {
      dbReady = false;
    }
  })();

  return dbInitPromise;
}

/**
 * Retrieve cached sparkline if it exists and is not expired (< 24h old)
 * Returns null immediately if database is not ready (non-blocking)
 */
export async function getCachedSparkline(
  coin: string,
  market: MarketType
): Promise<SparklineData | null> {
  // Return immediately if DB is not ready - don't block the caller
  if (!dbReady || !db) {
    return null;
  }

  try {
    const result = await db.getFirstAsync<CachedSparklineEntry>(
      `SELECT * FROM ${TABLE_NAME} WHERE coin = ? AND market = ?`,
      [coin, market]
    );

    if (!result) {
      return null;
    }

    // Check if expired (24h)
    const age = Date.now() - result.last_fetched_ts;
    if (age > CACHE_EXPIRY_MS) {
      // Don't delete here - let background cleanup handle it
      return null;
    }

    const points: SparklinePoint[] = JSON.parse(result.pointsJSON);
    return {
      points,
      isPositive: result.is_positive === 1,
      lastUpdated: result.last_fetched_ts,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve cached sparkline regardless of expiry (for immediate display while fetching fresh)
 * Returns { data, isStale } or null if no cache exists
 */
export async function getStaleCachedSparkline(
  coin: string,
  market: MarketType
): Promise<{ data: SparklineData; isStale: boolean } | null> {
  if (!dbReady || !db) {
    return null;
  }

  try {
    const result = await db.getFirstAsync<CachedSparklineEntry>(
      `SELECT * FROM ${TABLE_NAME} WHERE coin = ? AND market = ?`,
      [coin, market]
    );

    if (!result) {
      return null;
    }

    const points: SparklinePoint[] = JSON.parse(result.pointsJSON);
    const age = Date.now() - result.last_fetched_ts;

    return {
      data: {
        points,
        isPositive: result.is_positive === 1,
        lastUpdated: result.last_fetched_ts,
      },
      isStale: age > CACHE_EXPIRY_MS,
    };
  } catch {
    return null;
  }
}

/**
 * Store sparkline data in the cache
 */
export async function setCachedSparkline(
  coin: string,
  market: MarketType,
  data: SparklineData
): Promise<void> {
  if (!dbReady || !db) {
    return;
  }

  try {
    const pointsJSON = JSON.stringify(data.points);

    // Use REPLACE to insert or update
    await db.runAsync(
      `REPLACE INTO ${TABLE_NAME} (coin, market, last_fetched_ts, pointsJSON, is_positive) VALUES (?, ?, ?, ?, ?)`,
      [coin, market, Date.now(), pointsJSON, data.isPositive ? 1 : 0]
    );

    // Trigger cleanup to ensure we don't exceed max entries (async, don't await)
    cleanupOldEntries().catch(() => {});
  } catch {
    // Silently ignore cache errors
  }
}

/**
 * Bulk retrieve cached sparklines for multiple items (efficient batch loading)
 */
export async function bulkGetCachedSparklines(
  items: Array<{ coin: string; market: MarketType }>
): Promise<Map<string, SparklineData>> {
  const result = new Map<string, SparklineData>();

  if (!dbReady || !db || items.length === 0) {
    return result;
  }

  try {
    // Build query with placeholders for each item
    const placeholders = items.map(() => '(coin = ? AND market = ?)').join(' OR ');
    const params = items.flatMap(item => [item.coin, item.market]);

    const rows = await db.getAllAsync<CachedSparklineEntry>(
      `SELECT * FROM ${TABLE_NAME} WHERE ${placeholders}`,
      params
    );

    const now = Date.now();

    for (const row of rows) {
      // Skip expired entries
      if (now - row.last_fetched_ts > CACHE_EXPIRY_MS) continue;

      const key = `${row.market}:${row.coin}`;
      const points: SparklinePoint[] = JSON.parse(row.pointsJSON);

      result.set(key, {
        points,
        isPositive: row.is_positive === 1,
        lastUpdated: row.last_fetched_ts,
      });
    }

  } catch {
    // Silently ignore bulk retrieval errors
  }

  return result;
}

/**
 * Remove entries older than 24 hours
 */
async function cleanupExpiredCache(): Promise<void> {
  if (!db) return;

  try {
    const cutoffTime = Date.now() - CACHE_EXPIRY_MS;

    await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE last_fetched_ts < ?`,
      [cutoffTime]
    );
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Remove oldest cache entries when exceeding the max limit (LRU eviction)
 */
async function cleanupOldEntries(): Promise<void> {
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

  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Clear all cached sparklines
 */
export async function clearSparklineCache(): Promise<void> {
  if (!db) {
    return;
  }

  try {
    await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
  } catch {
    // Silently ignore clear errors
  }
}

/**
 * Get cache statistics (for debugging/settings UI)
 */
export async function getSparklineCacheStats(): Promise<{
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
      `SELECT COALESCE(SUM(LENGTH(pointsJSON)), 0) as totalSize FROM ${TABLE_NAME}`
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
  } catch {
    return { totalEntries: 0, totalSizeBytes: 0, oldestEntry: null, newestEntry: null };
  }
}

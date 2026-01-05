/**
 * SparklineDataContext provides 24h sparkline data for ticker cells.
 * Manages batch fetching, in-memory caching, SQLite persistence, and data access.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
} from 'react';
import type { SparklineData, SparklinePoint } from '../ui/shared/components/sparkline';
import type { MarketType, SpotMarket } from '../types';
import { useWebSocket } from './WebSocketContext';
import { resolveSubscriptionCoin } from '../lib/markets';
import {
  initSparklineCache,
  isSparklineCacheReady,
  getStaleCachedSparkline,
  setCachedSparkline,
  bulkGetCachedSparklines,
} from '../lib/sparklineCache';

// Re-export types for convenience
export type { SparklineData, SparklinePoint };

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (sparkline data is historical, changes slowly)
const MAX_CACHE_ENTRIES = 150;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 750; // Increased from 500ms to further reduce rate limiting
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Retry with exponential backoff for 429 errors
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY_MS
): Promise<T> => {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const is429 = error?.message?.includes('429') ||
                    error?.status === 429 ||
                    error?.statusCode === 429;
      if (!is429 || attempt === maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

interface CacheEntry extends SparklineData {
  expiresAt: number;
}

interface SparklineDataContextValue {
  getSparklineData: (coin: string, marketType: MarketType) => SparklineData | null;
  prefetchSparklines: (coins: string[], marketType: MarketType) => void;
  hydrateFromCache: (items: Array<{ coin: string; marketType: MarketType }>) => Promise<void>;
  isCacheReady: boolean;
  pauseFetching: () => void;
  resumeFetching: () => void;
}

const SparklineDataContext = createContext<SparklineDataContextValue | null>(null);

export function SparklineDataProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { infoClient, state: wsState } = useWebSocket();

  // SQLite cache ready state
  const [sqliteCacheReady, setSqliteCacheReady] = useState(false);

  // In-memory cache
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Initialize SQLite cache on mount
  useEffect(() => {
    initSparklineCache()
      .then(() => {
        setSqliteCacheReady(true);
      })
      .catch(() => {});
  }, []);

  // Track pending fetches to avoid duplicates
  const pendingFetchesRef = useRef<Set<string>>(new Set());

  // Track coins that have been prefetched in this session (to avoid re-queuing)
  const prefetchedCoinsRef = useRef<Set<string>>(new Set());

  // Batch queue for fetching
  const batchQueueRef = useRef<Array<{ coin: string; marketType: MarketType }>>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pause control for chart screen priority
  const isPausedRef = useRef(false);

  // Ref for scheduling batch processing (to avoid circular dependencies)
  const scheduleProcessingRef = useRef<(() => void) | null>(null);

  // Ref for spot markets (to avoid dependency issues)
  const spotMarketsRef = useRef<SpotMarket[]>([]);
  spotMarketsRef.current = wsState.spotMarkets;

  // Generate cache key
  const getCacheKey = useCallback((coin: string, marketType: MarketType): string => {
    return `${marketType}:${coin}`;
  }, []);

  // Hydrate a single entry from SQLite to memory cache (async, non-blocking)
  const hydrateSingleFromSqlite = useCallback(async (coin: string, marketType: MarketType) => {
    const key = getCacheKey(coin, marketType);

    // Prevent duplicate hydration
    if (pendingFetchesRef.current.has(key)) return;
    pendingFetchesRef.current.add(key);

    try {
      const cached = await getStaleCachedSparkline(coin, marketType);

      if (cached) {
        // Populate memory cache with SQLite data
        cacheRef.current.set(key, {
          ...cached.data,
          expiresAt: cached.isStale
            ? Date.now() // Expired in SQLite, will trigger refetch
            : Date.now() + CACHE_TTL_MS,
        });

        // If stale (>24h), queue for background refresh
        if (cached.isStale) {
          batchQueueRef.current.push({ coin, marketType });
          scheduleProcessingRef.current?.();
        }
      } else {
        // No SQLite data, queue for fetch
        batchQueueRef.current.push({ coin, marketType });
        scheduleProcessingRef.current?.();
      }
    } catch {
      // Silently ignore hydration errors
    } finally {
      pendingFetchesRef.current.delete(key);
    }
  }, [getCacheKey]);

  // Get sparkline data from cache
  const getSparklineData = useCallback((coin: string, marketType: MarketType): SparklineData | null => {
    const key = getCacheKey(coin, marketType);
    const entry = cacheRef.current.get(key);

    // Return from memory cache if fresh
    if (entry && Date.now() < entry.expiresAt) {
      return {
        points: entry.points,
        isPositive: entry.isPositive,
        lastUpdated: entry.lastUpdated,
      };
    }

    // Memory cache expired or missing - try SQLite (async, non-blocking)
    if (isSparklineCacheReady() && !pendingFetchesRef.current.has(key)) {
      // Trigger async SQLite lookup
      hydrateSingleFromSqlite(coin, marketType);
    }

    // Return stale memory data if available (better than nothing while loading)
    if (entry) {
      return {
        points: entry.points,
        isPositive: entry.isPositive,
        lastUpdated: entry.lastUpdated,
      };
    }

    return null;
  }, [getCacheKey, hydrateSingleFromSqlite]);

  // Store data in cache with LRU eviction and SQLite persistence
  const setCacheEntry = useCallback((coin: string, marketType: MarketType, data: SparklineData) => {
    const key = getCacheKey(coin, marketType);
    const cache = cacheRef.current;

    // LRU eviction if at capacity
    if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
      // Remove oldest entry (first in map)
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    // Delete and re-add to maintain insertion order (LRU)
    cache.delete(key);
    cache.set(key, {
      ...data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Persist to SQLite in background (async, no await)
    if (isSparklineCacheReady()) {
      setCachedSparkline(coin, marketType, data).catch(() => {});
    }
  }, [getCacheKey]);

  // Fetch sparkline data for a single coin
  const fetchSparkline = useCallback(async (coin: string, marketType: MarketType): Promise<void> => {
    const key = getCacheKey(coin, marketType);

    // Skip if already pending or cached
    if (pendingFetchesRef.current.has(key)) return;

    const existing = cacheRef.current.get(key);
    if (existing && Date.now() < existing.expiresAt) return;

    if (!infoClient) return;

    pendingFetchesRef.current.add(key);

    try {
      // Resolve subscription coin format
      const subscriptionCoin = resolveSubscriptionCoin(
        marketType,
        coin,
        spotMarketsRef.current
      );

      const now = Date.now();
      const startTime = now - 24 * 60 * 60 * 1000; // 24h ago

      const candles = await retryWithBackoff(() =>
        infoClient.candleSnapshot({
          coin: subscriptionCoin,
          interval: '15m',
          startTime,
          endTime: now,
        })
      );

      if (candles && candles.length >= 2) {
        const points: SparklinePoint[] = candles.map((c: any) => ({
          timestamp: c.t,
          value: parseFloat(c.c), // close price
        }));

        const firstClose = parseFloat(candles[0].c);
        const lastClose = parseFloat(candles[candles.length - 1].c);
        const isPositive = lastClose >= firstClose;

        setCacheEntry(coin, marketType, {
          points,
          isPositive,
          lastUpdated: Date.now(),
        });
      }
    } catch {
      // Silently fail - sparkline is optional
    } finally {
      pendingFetchesRef.current.delete(key);
    }
  }, [infoClient, getCacheKey, setCacheEntry]);

  // Process batch queue
  const processBatchQueue = useCallback(async () => {
    // If paused (chart screen active), re-schedule for later
    if (isPausedRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 500);
      return;
    }

    const queue = [...batchQueueRef.current];
    batchQueueRef.current = [];
    batchTimeoutRef.current = null;

    if (queue.length === 0) return;

    // Process in batches
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      const batch = queue.slice(i, i + BATCH_SIZE);

      // Fetch batch in parallel
      await Promise.all(
        batch.map(({ coin, marketType }) => fetchSparkline(coin, marketType))
      );

      // Delay between batches
      if (i + BATCH_SIZE < queue.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
  }, [fetchSparkline]);

  // Set up the scheduling function (after processBatchQueue is defined)
  scheduleProcessingRef.current = () => {
    if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  };

  // Add coins to batch queue and trigger processing
  const prefetchSparklines = useCallback((coins: string[], marketType: MarketType) => {
    if (!infoClient) return;

    // Add to queue, skipping duplicates and cached items
    coins.forEach(coin => {
      const key = getCacheKey(coin, marketType);

      // Skip if already prefetched in this session
      if (prefetchedCoinsRef.current.has(key)) return;

      // Skip if already in queue
      if (batchQueueRef.current.some(item =>
        item.coin === coin && item.marketType === marketType
      )) {
        return;
      }

      // Skip if already pending
      if (pendingFetchesRef.current.has(key)) return;

      // Skip if cached and fresh
      const existing = cacheRef.current.get(key);
      if (existing && Date.now() < existing.expiresAt) {
        // Mark as prefetched since it's already cached
        prefetchedCoinsRef.current.add(key);
        return;
      }

      // Mark as prefetched to prevent re-queuing
      prefetchedCoinsRef.current.add(key);
      batchQueueRef.current.push({ coin, marketType });
    });

    // Schedule batch processing
    if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  }, [infoClient, getCacheKey, processBatchQueue]);

  // Pause fetching (for chart screen priority)
  const pauseFetching = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // Resume fetching (when leaving chart screen)
  const resumeFetching = useCallback(() => {
    isPausedRef.current = false;
    // Trigger processing if queue has items
    if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  }, [processBatchQueue]);

  // Bulk hydrate from SQLite cache (for visible items on app start)
  const hydrateFromCache = useCallback(async (items: Array<{ coin: string; marketType: MarketType }>) => {
    if (!isSparklineCacheReady() || items.length === 0) return;

    try {
      // Map marketType to market for the cache function
      const cacheItems = items.map(item => ({ coin: item.coin, market: item.marketType }));
      const cachedData = await bulkGetCachedSparklines(cacheItems);

      cachedData.forEach((data, key) => {
        // Key format is "market:coin"
        cacheRef.current.set(key, {
          ...data,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      });
    } catch {
      // Silently ignore hydration errors
    }
  }, []);

  const value = useMemo(() => ({
    getSparklineData,
    prefetchSparklines,
    hydrateFromCache,
    isCacheReady: sqliteCacheReady,
    pauseFetching,
    resumeFetching,
  }), [getSparklineData, prefetchSparklines, hydrateFromCache, sqliteCacheReady, pauseFetching, resumeFetching]);

  return (
    <SparklineDataContext.Provider value={value}>
      {children}
    </SparklineDataContext.Provider>
  );
}

export function useSparklineData(): SparklineDataContextValue {
  const context = useContext(SparklineDataContext);
  if (!context) {
    throw new Error('useSparklineData must be used within a SparklineDataProvider');
  }
  return context;
}

// Optional hook that doesn't throw if context is missing (for gradual adoption)
export function useSparklineDataOptional(): SparklineDataContextValue | null {
  return useContext(SparklineDataContext);
}

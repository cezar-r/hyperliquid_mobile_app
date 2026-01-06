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
import { useAppStateTransition } from '../hooks';
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
const BATCH_SIZE = 12; // Increased from 5 for faster loading
const BATCH_DELAY_MS = 250; // Reduced from 750ms for faster loading
const MAX_PARALLEL_BATCHES = 2; // Process 2 batches concurrently
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes - periodic refresh to keep sparklines up to date

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
  refreshTrigger: number; // Increments every 15 minutes to trigger sparkline refresh
  cacheVersion: number; // Increments on cache updates to trigger reactive re-renders
  // Visibility-aware fetching for SearchScreen
  setVisibleItems: (coins: string[], marketType: MarketType) => void;
  clearVisibility: () => void;
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

  // Refresh trigger - increments every 15 minutes to trigger sparkline refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cache version - increments on cache updates to trigger reactive re-renders
  const [cacheVersion, setCacheVersion] = useState(0);

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

  // Track items that have been hydrated from SQLite (to prevent re-hydration loops)
  const hydratedFromSqliteRef = useRef<Set<string>>(new Set());

  // Batch queue for fetching
  const batchQueueRef = useRef<Array<{ coin: string; marketType: MarketType }>>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Guard against overlapping batch processing

  // Pause control for chart screen priority
  const isPausedRef = useRef(false);

  // Visibility-aware fetching for SearchScreen
  // Currently visible items get priority, off-screen items are dropped
  const visibleItemsRef = useRef<Set<string>>(new Set());
  const visibilityModeActiveRef = useRef(false);

  // Ref for scheduling batch processing (to avoid circular dependencies)
  const scheduleProcessingRef = useRef<(() => void) | null>(null);

  // Ref for spot markets (to avoid dependency issues)
  const spotMarketsRef = useRef<SpotMarket[]>([]);
  spotMarketsRef.current = wsState.spotMarkets;

  // Ref for infoClient (to avoid stale closure in scheduled callbacks)
  const infoClientRef = useRef(infoClient);
  infoClientRef.current = infoClient;

  // Track last refresh time for foreground staleness check
  const lastRefreshRef = useRef<number>(Date.now());

  // Periodic refresh interval - refreshes sparklines every 15 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Sparkline] 15-min refresh triggered');
      lastRefreshRef.current = Date.now();

      // Clear session tracking to allow re-fetching and re-hydration
      prefetchedCoinsRef.current.clear();
      hydratedFromSqliteRef.current.clear();
      console.log('[Sparkline] Cleared prefetchedCoinsRef and hydratedFromSqliteRef');

      // Expire all memory cache entries to force refetch
      const cacheSize = cacheRef.current.size;
      cacheRef.current.forEach((entry, key) => {
        cacheRef.current.set(key, { ...entry, expiresAt: 0 });
      });
      console.log(`[Sparkline] Expired ${cacheSize} cache entries`);

      // Increment trigger to notify consumers (HomeScreen will re-prefetch)
      setRefreshTrigger(prev => prev + 1);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  // Check staleness when app returns to foreground
  useAppStateTransition(
    () => {
      const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;
      console.log(`[Sparkline] App foregrounded, time since refresh: ${Math.round(timeSinceLastRefresh / 1000)}s`);

      if (timeSinceLastRefresh >= REFRESH_INTERVAL_MS) {
        console.log('[Sparkline] Data stale, triggering refresh');
        lastRefreshRef.current = Date.now();
        prefetchedCoinsRef.current.clear();
        hydratedFromSqliteRef.current.clear();
        cacheRef.current.forEach((entry, key) => {
          cacheRef.current.set(key, { ...entry, expiresAt: 0 });
        });
        setRefreshTrigger(prev => prev + 1);
      }
    },
    undefined
  );

  // Generate cache key
  const getCacheKey = useCallback((coin: string, marketType: MarketType): string => {
    return `${marketType}:${coin}`;
  }, []);

  // Hydrate a single entry from SQLite to memory cache (async, non-blocking)
  // This is called when memory cache is expired/missing, so always queue for background refresh
  const hydrateSingleFromSqlite = useCallback(async (coin: string, marketType: MarketType) => {
    const key = getCacheKey(coin, marketType);

    // Prevent duplicate hydration - check both guards
    if (pendingFetchesRef.current.has(key)) return;
    if (hydratedFromSqliteRef.current.has(key)) return; // Already hydrated this session

    pendingFetchesRef.current.add(key);

    try {
      const cached = await getStaleCachedSparkline(coin, marketType);

      if (cached) {
        // Mark as hydrated BEFORE setting cache to prevent race conditions
        hydratedFromSqliteRef.current.add(key);

        // Calculate actual expiration based on when data was originally fetched
        const originalExpiresAt = cached.data.lastUpdated + CACHE_TTL_MS;
        const isStale = Date.now() >= originalExpiresAt;

        // Populate memory cache with SQLite data for immediate display
        // Use original expiration time (or 0 if already stale) to preserve freshness semantics
        cacheRef.current.set(key, {
          ...cached.data,
          expiresAt: isStale ? 0 : originalExpiresAt,
        });
        // Trigger re-render in consuming components
        setCacheVersion(v => v + 1);
        console.log(`[Sparkline] ${key} hydrated from SQLite (stale=${isStale}, age=${Math.round((Date.now() - cached.data.lastUpdated) / 1000)}s)`);

        // Queue for background refresh if data is stale
        if (isStale) {
          const alreadyQueued = batchQueueRef.current.some(
            item => item.coin === coin && item.marketType === marketType
          );
          const alreadyPrefetched = prefetchedCoinsRef.current.has(key);

          if (!alreadyQueued && !alreadyPrefetched) {
            prefetchedCoinsRef.current.add(key);
            batchQueueRef.current.push({ coin, marketType });
            scheduleProcessingRef.current?.();
          }
        }
      }

      // Queue for background refresh if data doesn't exist at all
      if (!cached && !cacheRef.current.has(key)) {
        const alreadyQueued = batchQueueRef.current.some(
          item => item.coin === coin && item.marketType === marketType
        );
        const alreadyPrefetched = prefetchedCoinsRef.current.has(key);

        if (!alreadyQueued && !alreadyPrefetched) {
          prefetchedCoinsRef.current.add(key);
          batchQueueRef.current.push({ coin, marketType });
          scheduleProcessingRef.current?.();
        }
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
    // Check both guards to prevent re-hydration loops
    if (isSparklineCacheReady() &&
        !pendingFetchesRef.current.has(key) &&
        !hydratedFromSqliteRef.current.has(key)) {
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

    // Increment cache version to trigger reactive re-renders in consuming components
    setCacheVersion(v => v + 1);

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

    // Use ref to always get latest value (avoids stale closure)
    const client = infoClientRef.current;
    if (!client) {
      // Allow retry by removing from prefetched set
      prefetchedCoinsRef.current.delete(key);
      return;
    }

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

      console.log(`[Sparkline] Fetching ${key} -> ${subscriptionCoin}`);

      const candles = await retryWithBackoff(() =>
        client.candleSnapshot({
          coin: subscriptionCoin,
          interval: '15m',
          startTime,
          endTime: now,
        })
      );

      console.log(`[Sparkline] ${key} got ${candles?.length ?? 0} candles`);

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
      } else {
        // Insufficient data - allow retry by removing from prefetched set
        prefetchedCoinsRef.current.delete(key);
      }
    } catch (error) {
      // Allow retry on next prefetch call by removing from prefetched set
      prefetchedCoinsRef.current.delete(key);
      console.log(`[Sparkline] ${key} fetch error:`, error);
    } finally {
      pendingFetchesRef.current.delete(key);
    }
  }, [getCacheKey, setCacheEntry]);

  // Process batch queue with parallel batch processing
  const processBatchQueue = useCallback(async () => {
    // NOTE: Pause check removed - it was getting stuck due to useFocusEffect not firing cleanup
    // The chart screen can still function without pausing sparkline fetches

    // If infoClient not ready, re-schedule for later (don't clear queue)
    // Use ref to always get latest value (avoids stale closure in scheduled callbacks)
    if (!infoClientRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 500);
      return;
    }

    // Prevent overlapping batch processing
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    try {
      const queue = [...batchQueueRef.current];
      batchQueueRef.current = [];
      batchTimeoutRef.current = null;

      if (queue.length === 0) return;

      // Process multiple batches in parallel for faster loading
      const parallelBatchSize = BATCH_SIZE * MAX_PARALLEL_BATCHES;
      for (let i = 0; i < queue.length; i += parallelBatchSize) {
        const parallelPromises: Promise<void>[] = [];

        // Create up to MAX_PARALLEL_BATCHES concurrent batch fetches
        for (let j = 0; j < MAX_PARALLEL_BATCHES; j++) {
          const startIdx = i + (j * BATCH_SIZE);
          const batch = queue.slice(startIdx, startIdx + BATCH_SIZE);

          if (batch.length > 0) {
            // Each batch fetches its items in parallel
            parallelPromises.push(
              Promise.all(
                batch.map(({ coin, marketType }) => fetchSparkline(coin, marketType))
              ).then(() => {})
            );
          }
        }

        // Wait for all parallel batches to complete
        await Promise.all(parallelPromises);

        // Short delay between parallel batch groups (only if more remain)
        if (i + parallelBatchSize < queue.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }
    } finally {
      isProcessingRef.current = false;

      // Check if more items were added while processing and schedule next run
      if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
      }
    }
  }, [fetchSparkline]);

  // Set up the scheduling function (after processBatchQueue is defined)
  scheduleProcessingRef.current = () => {
    if (!batchTimeoutRef.current && !isProcessingRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  };

  // Add coins to batch queue and trigger processing
  const prefetchSparklines = useCallback((coins: string[], marketType: MarketType) => {
    if (!infoClient) {
      console.log('[Sparkline] prefetchSparklines: no infoClient');
      return;
    }

    // Add to queue, skipping duplicates and cached items
    let addedCount = 0;
    let skippedPrefetched = 0;
    let skippedQueued = 0;
    let skippedPending = 0;
    let skippedCached = 0;

    coins.forEach(coin => {
      const key = getCacheKey(coin, marketType);

      // Skip if already prefetched in this session
      if (prefetchedCoinsRef.current.has(key)) {
        skippedPrefetched++;
        return;
      }

      // Skip if already in queue
      if (batchQueueRef.current.some(item =>
        item.coin === coin && item.marketType === marketType
      )) {
        skippedQueued++;
        return;
      }

      // Skip if already pending
      if (pendingFetchesRef.current.has(key)) {
        skippedPending++;
        return;
      }

      // Skip if cached and fresh
      const existing = cacheRef.current.get(key);
      if (existing && Date.now() < existing.expiresAt) {
        // Mark as prefetched since it's already cached
        prefetchedCoinsRef.current.add(key);
        skippedCached++;
        return;
      }

      // Mark as prefetched to prevent re-queuing
      prefetchedCoinsRef.current.add(key);
      batchQueueRef.current.push({ coin, marketType });
      addedCount++;
    });

    console.log(`[Sparkline] prefetchSparklines(${marketType}): total=${coins.length}, added=${addedCount}, skippedPrefetched=${skippedPrefetched}, skippedCached=${skippedCached}, skippedQueued=${skippedQueued}, skippedPending=${skippedPending}`);

    // Schedule batch processing if not already processing/scheduled
    if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current && !isProcessingRef.current) {
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
    // Trigger processing if queue has items and not already processing/scheduled
    if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current && !isProcessingRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  }, [processBatchQueue]);

  // Set visible items for priority fetching (used by SearchScreen)
  // Drops off-screen items from queue, prioritizes visible items at front
  const setVisibleItems = useCallback((coins: string[], marketType: MarketType) => {
    if (!infoClient) return;

    const newVisibleSet = new Set(coins.map(c => getCacheKey(c, marketType)));

    // Remove off-screen items from main queue (cancel them)
    batchQueueRef.current = batchQueueRef.current.filter(item => {
      const key = getCacheKey(item.coin, item.marketType);
      return newVisibleSet.has(key);
    });

    // Add new visible items to FRONT of queue
    coins.forEach(coin => {
      const key = getCacheKey(coin, marketType);

      // Skip if already pending fetch
      if (pendingFetchesRef.current.has(key)) return;

      // Skip if cached and fresh
      const existing = cacheRef.current.get(key);
      if (existing && Date.now() < existing.expiresAt) return;

      // Skip if already in queue
      if (batchQueueRef.current.some(i => getCacheKey(i.coin, i.marketType) === key)) return;

      // Mark as prefetched to prevent duplicate queueing (consistent with prefetchSparklines)
      prefetchedCoinsRef.current.add(key);

      // Add to FRONT (priority)
      batchQueueRef.current.unshift({ coin, marketType });
    });

    visibleItemsRef.current = newVisibleSet;
    visibilityModeActiveRef.current = true;

    // Trigger processing if we have items and not already processing/scheduled
    if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current && !isProcessingRef.current) {
      batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
    }
  }, [infoClient, getCacheKey, processBatchQueue]);

  // Clear visibility mode (when leaving SearchScreen)
  const clearVisibility = useCallback(() => {
    visibleItemsRef.current.clear();
    visibilityModeActiveRef.current = false;

    // Remove orphaned prefetch markers for items being dropped from queue
    // This prevents "already prefetched" false positives when returning to SearchScreen
    batchQueueRef.current.forEach(item => {
      const key = getCacheKey(item.coin, item.marketType);
      // Only remove if not actually cached (to allow retry)
      if (!cacheRef.current.has(key)) {
        prefetchedCoinsRef.current.delete(key);
      }
    });

    // Clear pending queue since we're leaving the screen
    batchQueueRef.current = [];
  }, [getCacheKey]);

  // Bulk hydrate from SQLite cache (for visible items on app start)
  // Shows cached data immediately, then queues stale items for refresh
  const hydrateFromCache = useCallback(async (items: Array<{ coin: string; marketType: MarketType }>) => {
    if (!isSparklineCacheReady() || items.length === 0) return;

    try {
      // Map marketType to market for the cache function
      const cacheItems = items.map(item => ({ coin: item.coin, market: item.marketType }));
      const cachedData = await bulkGetCachedSparklines(cacheItems);

      const staleItems: Array<{ coin: string; marketType: MarketType }> = [];

      cachedData.forEach((data, key) => {
        // Key format is "market:coin"
        // Calculate actual expiration based on when data was originally fetched
        const originalExpiresAt = data.lastUpdated + CACHE_TTL_MS;
        const isStale = Date.now() >= originalExpiresAt;

        cacheRef.current.set(key, {
          ...data,
          expiresAt: isStale ? 0 : originalExpiresAt,
        });

        // Track stale items for refresh
        if (isStale) {
          // Key format is "marketType:coin" - only split on first colon
          // (coin may contain colons for HIP-3 markets like "xyz:XYZ100")
          const colonIdx = key.indexOf(':');
          const marketType = key.slice(0, colonIdx) as MarketType;
          const coin = key.slice(colonIdx + 1);
          staleItems.push({ coin, marketType });
        }
      });

      // Queue stale items for background refresh
      if (staleItems.length > 0) {
        console.log(`[Sparkline] hydrateFromCache: ${staleItems.length}/${cachedData.size} items are stale, queueing refresh`);
        staleItems.forEach(({ coin, marketType }) => {
          const key = getCacheKey(coin, marketType);
          if (!prefetchedCoinsRef.current.has(key) && !pendingFetchesRef.current.has(key)) {
            prefetchedCoinsRef.current.add(key);
            batchQueueRef.current.push({ coin, marketType });
          }
        });

        // Schedule batch processing
        if (batchQueueRef.current.length > 0 && !batchTimeoutRef.current && !isProcessingRef.current) {
          batchTimeoutRef.current = setTimeout(processBatchQueue, 50);
        }
      }
    } catch {
      // Silently ignore hydration errors
    }
  }, [getCacheKey, processBatchQueue]);

  const value = useMemo(() => ({
    getSparklineData,
    prefetchSparklines,
    hydrateFromCache,
    isCacheReady: sqliteCacheReady,
    pauseFetching,
    resumeFetching,
    refreshTrigger,
    cacheVersion,
    setVisibleItems,
    clearVisibility,
  }), [getSparklineData, prefetchSparklines, hydrateFromCache, sqliteCacheReady, pauseFetching, resumeFetching, refreshTrigger, cacheVersion, setVisibleItems, clearVisibility]);

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

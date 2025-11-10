import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useAccount } from '@reown/appkit-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { resolveSpotTicker } from '../../../lib/formatting';
import { logScreenMount, logScreenUnmount, logScreenFocus, logScreenBlur, logRender, logUserAction, logScreenFullyRendered } from '../../../lib/logger';
import { styles } from './styles/HistoryScreen.styles';
import type { UserFill, LedgerUpdate } from '../../../types';
import { PanelSelector, EmptyState, ErrorState, SkeletonScreen, VirtualizedTradesList } from '../../shared/components';
import { LedgerCard, LoadingState } from './components';

type ViewFilter = 'Trades' | 'Ledger';

const HISTORY_VIEW_FILTER_KEY = 'hl_history_view_filter';

export default function HistoryScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, infoClient } = useWallet();
  const { state: wsState } = useWebSocket();
  const isFocused = useIsFocused();
  const tradesListRef = useRef<FlatList<UserFill>>(null);
  const ledgerListRef = useRef<FlatList<LedgerUpdate>>(null);

  // For skeleton loading
  const [isReady] = useState(true);
  const [filterHydrated, setFilterHydrated] = useState(false);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('HistoryScreen');
    return () => logScreenUnmount('HistoryScreen');
  }, []);

  // Filter states
  const [viewFilter, setViewFilter] = useState<ViewFilter>('Trades');
  const [ledgerUpdates, setLedgerUpdates] = useState<LedgerUpdate[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Defer rendering was removed to avoid initial flicker on first tab visit

  // Fast lookup sets for spot markets to avoid per-row array scans
  const spotApiNameSet = useMemo(() => {
    const set = new Set<string>();
    wsState.spotMarkets.forEach((m) => {
      if (m.apiName) set.add(m.apiName);
    });
    return set;
  }, [wsState.spotMarkets]);
  const spotBaseTokenSet = useMemo(() => {
    const set = new Set<string>();
    wsState.spotMarkets.forEach((m) => {
      const base = m.name.split('/')[0];
      set.add(base);
    });
    return set;
  }, [wsState.spotMarkets]);

  // Load saved filter on mount
  useEffect(() => {
    const loadFilter = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(HISTORY_VIEW_FILTER_KEY);
        if (savedFilter && ['Trades', 'Ledger'].includes(savedFilter)) {
          setViewFilter(savedFilter as ViewFilter);
        }
      } catch (error) {
        console.error('[HistoryScreen] Error loading filter:', error);
      } finally {
        setFilterHydrated(true);
      }
    };
    loadFilter();
  }, []);

  // Fetch ledger updates when viewing Ledger tab
  useEffect(() => {
    const fetchLedgerHistory = async () => {
      if (!infoClient || !address || viewFilter !== 'Ledger') return;

      setIsLoadingLedger(true);
      setLedgerError(null);

      try {
        // Fetch last 30 days of ledger updates
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const updates = await infoClient.userNonFundingLedgerUpdates({
          user: address as `0x${string}`,
          startTime: thirtyDaysAgo,
        });

        // Reverse to show newest first
        setLedgerUpdates((updates as LedgerUpdate[]).reverse());
      } catch (err: any) {
        console.error('[HistoryScreen] Failed to fetch ledger history:', err);
        setLedgerError('Failed to load ledger history');
      } finally {
        setIsLoadingLedger(false);
      }
    };

    fetchLedgerHistory();
  }, [infoClient, address, viewFilter]);

  // Helper to get next/previous filter (circular navigation)
  const getNextViewFilter = (
    current: ViewFilter,
    direction: 'left' | 'right'
  ): ViewFilter => {
    const filters: ViewFilter[] = ['Trades', 'Ledger'];
    const currentIndex = filters.indexOf(current);

    if (direction === 'left') {
      // Swipe left: move to next
      return filters[(currentIndex + 1) % filters.length];
    } else {
      // Swipe right: move to previous
      return filters[(currentIndex - 1 + filters.length) % filters.length];
    }
  };

  // Save view filter when it changes with animation
  const handleFilterChange = async (
    filter: ViewFilter,
    animated: boolean = false,
    direction?: 'left' | 'right'
  ) => {
    if (animated && direction) {
      // Start slide animation
      const slideDistance = direction === 'left' ? -50 : 50;
      slideAnim.setValue(slideDistance);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    setViewFilter(filter);
    try {
      await AsyncStorage.setItem(HISTORY_VIEW_FILTER_KEY, filter);
    } catch (error) {
      console.error('[HistoryScreen] Error saving filter:', error);
    }
  };

  // Handle swipe gesture
  const handleSwipe = (direction: 'left' | 'right') => {
    const nextFilter = getNextViewFilter(viewFilter, direction);
    handleFilterChange(nextFilter, true, direction);
  };

  // All trades (no market filtering)
  const allTrades = useMemo(() => {
    return account.data?.userFills || [];
  }, [account.data?.userFills]);

  // Snapshot trades only when the screen is focused and Trades tab is visible
  const [tradesSnapshot, setTradesSnapshot] = useState<UserFill[]>([]);
  useEffect(() => {
    if (isFocused && viewFilter === 'Trades') {
      setTradesSnapshot(account.data?.userFills || []);
      setTradesVisibleCount(300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, viewFilter]);

  // Trades pagination window (avoid mounting thousands at once)
  const [tradesVisibleCount, setTradesVisibleCount] = useState<number>(300);
  const visibleTrades = useMemo(() => {
    if (!tradesSnapshot || tradesSnapshot.length === 0) return [];
    return tradesSnapshot.slice(0, Math.min(tradesVisibleCount, tradesSnapshot.length));
  }, [tradesSnapshot, tradesVisibleCount]);

  // On returning to this screen, snap the current list to top
  useEffect(() => {
    if (isFocused) {
      requestAnimationFrame(() => {
        if (viewFilter === 'Trades') {
          tradesListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } else {
          ledgerListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
      });
    }
  }, [isFocused]); // only on focus regain

  // Pan gesture for swipe navigation
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { velocityX, translationX } = event;

      // Check if gesture is predominantly horizontal and fast enough
      if (Math.abs(velocityX) > 500 || Math.abs(translationX) > 100) {
        if (translationX < -50) {
          // Swipe left
          runOnJS(handleSwipe)('left');
        } else if (translationX > 50) {
          // Swipe right
          runOnJS(handleSwipe)('right');
        }
      }
    })
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20]);

  if (!isReady || !filterHydrated) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.contentContainer}>
        {/* View Filter Selector */}
        <PanelSelector
          options={['Trades', 'Ledger']}
          selectedOption={viewFilter}
          onOptionChange={(option) => handleFilterChange(option as ViewFilter)}
        />

        {/* Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            {!address ? (
              <EmptyState
                message="No wallet connected"
                submessage="Connect your wallet to view history"
              />
            ) : viewFilter === 'Trades' ? (
              <>
                {account.isLoading && <LoadingState message="Loading trades..." />}
                {account.error && <ErrorState error={account.error} />}
                {!account.isLoading && !account.error && account.data && (
                  <>
                    {tradesSnapshot.length > 0 ? (
                      <VirtualizedTradesList
                        ref={tradesListRef}
                        trades={tradesSnapshot}
                        visibleCount={tradesVisibleCount}
                        getDisplayCoin={(coin) => {
                          const isSpot =
                            (coin.startsWith('@') && spotApiNameSet.has(coin)) ||
                            (!coin.startsWith('@') && spotBaseTokenSet.has(coin));
                          return isSpot ? resolveSpotTicker(coin, wsState.spotMarkets) : coin;
                        }}
                        style={styles.scrollView}
                        contentContainerStyle={[styles.content, styles.recentTradesContainer]}
                        initialNumToRender={12}
                        maxToRenderPerBatch={12}
                        updateCellsBatchingPeriod={16}
                        windowSize={7}
                        removeClippedSubviews
                        onEndReached={() => {
                          if (visibleTrades.length < tradesSnapshot.length) {
                            setTradesVisibleCount((c) =>
                              Math.min(c + 300, tradesSnapshot.length)
                            );
                          }
                        }}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={
                          <EmptyState
                            message="No trades yet"
                            submessage="Your trade history will appear here"
                          />
                        }
                      />
                    ) : (
                      <EmptyState
                        message="No trades yet"
                        submessage="Your trade history will appear here"
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {isLoadingLedger && <LoadingState message="Loading ledger..." />}
                {ledgerError && <ErrorState error={ledgerError} />}
                {!isLoadingLedger && !ledgerError && (
                  <>
                    {ledgerUpdates.length > 0 ? (
                      <FlatList<LedgerUpdate>
                        ref={ledgerListRef}
                        style={styles.scrollView}
                        contentContainerStyle={[styles.content, styles.recentTradesContainer]}
                        data={ledgerUpdates}
                        keyExtractor={(update: LedgerUpdate, idx: number) => `ledger-${update.hash}-${update.time}-${idx}`}
                        renderItem={({ item }: { item: LedgerUpdate }) => (
                          <LedgerCard update={item} userAddress={address} />
                        )}
                        initialNumToRender={12}
                        maxToRenderPerBatch={12}
                        updateCellsBatchingPeriod={16}
                        windowSize={7}
                        removeClippedSubviews
                        ListEmptyComponent={
                          <EmptyState
                            message="No ledger activity"
                            submessage="Deposits, withdrawals, and transfers will appear here"
                          />
                        }
                      />
                    ) : (
                      <EmptyState
                        message="No ledger activity"
                        submessage="Deposits, withdrawals, and transfers will appear here"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}


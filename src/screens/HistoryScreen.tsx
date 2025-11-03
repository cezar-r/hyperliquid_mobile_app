import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { getDisplayTicker, resolveSpotTicker } from '../lib/formatting';
import { styles } from './styles/HistoryScreen.styles';
import type { UserFill, LedgerUpdate } from '../types';
import Color from '../styles/colors';

type ViewFilter = 'Trades' | 'Ledger';

const HISTORY_VIEW_FILTER_KEY = 'hl_history_view_filter';

// Helper to format price like SearchScreen
function formatPrice(num: number | undefined | null, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

// Helper to format dollar amounts (PnL, transfers) with commas and 2 decimals
function formatDollarAmount(amount: string): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) {
    return '0.00';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function HistoryScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, infoClient } = useWallet();
  const { state: wsState } = useWebSocket();
  
  // Filter states
  const [viewFilter, setViewFilter] = useState<ViewFilter>('Trades');
  const [ledgerUpdates, setLedgerUpdates] = useState<LedgerUpdate[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  
  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // For view filter sliding line animation
  const filterLinePosition = useRef(new Animated.Value(0)).current;

  // Helper to check if a fill is a spot trade (handles both base token name and API format)
  const isSpotFill = useCallback((coin: string) => {
    // Check if coin is in API format (@{index})
    if (coin.startsWith('@')) {
      return wsState.spotMarkets.some(m => m.apiName === coin);
    }
    // Otherwise check against base token names
    return wsState.spotMarkets.some(m => m.name.split('/')[0] === coin);
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
      }
    };
    loadFilter();
  }, []);

  // Animate filter line position when view filter changes
  useEffect(() => {
    const index = viewFilter === 'Trades' ? 0 : 1;
    const screenWidth = require('react-native').Dimensions.get('window').width;
    const paddingHorizontal = 16; // spacing.md
    const availableWidth = screenWidth - (paddingHorizontal * 2);
    const segmentWidth = availableWidth / 2;
    
    Animated.timing(filterLinePosition, {
      toValue: index * segmentWidth,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [viewFilter, filterLinePosition]);

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
  const getNextViewFilter = (current: ViewFilter, direction: 'left' | 'right'): ViewFilter => {
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
  const handleFilterChange = async (filter: ViewFilter, animated: boolean = false, direction?: 'left' | 'right') => {
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

  // Helper to format ledger type info
  const renderLedgerCard = (update: LedgerUpdate) => {
    const { delta } = update;
    
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const truncateAddress = (addr: string) => {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    switch (delta.type) {
      case 'deposit':
        return (
          <View style={styles.tradeLeftSide}>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideBuy]}>DEPOSIT</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                +{formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>From Arbitrum</Text>
            <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
          </View>
        );

      case 'withdraw':
        return (
          <View style={styles.tradeLeftSide}>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideSell]}>WITHDRAWAL</Text>
              <Text style={[styles.tradePnl, styles.pnlNegative]}>
                -{formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>To Arbitrum (Fee: {formatDollarAmount(delta.fee)} USDC)</Text>
            <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
          </View>
        );

      case 'accountClassTransfer':
        return (
          <View style={styles.tradeLeftSide}>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {delta.toPerp ? 'Spot → Perp' : 'Perp → Spot'}
            </Text>
            <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
          </View>
        );

      case 'spotTransfer':
        return (
          <View style={styles.tradeLeftSide}>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>SPOT TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.amount)} {delta.token}
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {address?.toLowerCase() === delta.user.toLowerCase()
                ? `To ${truncateAddress(delta.destination)}`
                : `From ${truncateAddress(delta.user)}`}
            </Text>
            <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
          </View>
        );

      case 'internalTransfer':
        return (
          <View style={styles.tradeLeftSide}>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>INTERNAL TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {address?.toLowerCase() === delta.user.toLowerCase()
                ? `To ${truncateAddress(delta.destination)}`
                : `From ${truncateAddress(delta.user)}`}
            </Text>
            <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* View Filter Selector */}
        <View style={styles.filterContainer}>
          <View style={styles.panelSelector}>
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => handleFilterChange('Trades')}
            >
              <Text style={[
                styles.panelText,
                viewFilter === 'Trades' && styles.panelTextActive
              ]}>
                Trades
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => handleFilterChange('Ledger')}
            >
              <Text style={[
                styles.panelText,
                viewFilter === 'Ledger' && styles.panelTextActive
              ]}>
                Ledger
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.separatorContainer}>
            <Animated.View
              style={[
                styles.slidingSeparator,
                {
                  transform: [{ translateX: filterLinePosition }],
                },
              ]}
            />
          </View>
        </View>

        {/* Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
              {!address && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No wallet connected</Text>
                  <Text style={styles.emptySubtext}>
                    Connect your wallet to view history
                  </Text>
                </View>
              )}

          {address && viewFilter === 'Trades' && (
            <>
              {account.isLoading && (
                <View style={styles.loadingContainer}>
                  <Image 
                    source={require('../../assets/blob_green.gif')} 
                    style={styles.loadingGif}
                  />
                  <Text style={styles.loadingText}>Loading trades...</Text>
                </View>
              )}

              {account.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {account.error}</Text>
                </View>
              )}

              {!account.isLoading && !account.error && account.data && (
                <>
                  {allTrades.length > 0 ? (
                    <View style={styles.recentTradesContainer}>
                      {allTrades.map((fill: UserFill, idx: number) => {
                        const displayCoin = isSpotFill(fill.coin)
                          ? resolveSpotTicker(fill.coin, wsState.spotMarkets)
                          : fill.coin;
                        return (
                        <View key={`fill-${idx}`}>
                          <View style={styles.tradeCard}>
                            <View style={styles.tradeLeftSide}>
                              <View style={styles.tradeTopRow}>
                                <Text style={styles.tradeCoin}>{displayCoin}</Text>
                                <Text style={[
                                  styles.tradeSide,
                                  fill.side === 'B' ? styles.sideBuy : styles.sideSell
                                ]}>
                                  {fill.side === 'B' ? 'BUY' : 'SELL'}
                                </Text>
                                {fill.closedPnl && parseFloat(fill.closedPnl) !== 0 && (
                                  <Text style={[
                                    styles.tradePnl,
                                    parseFloat(fill.closedPnl) >= 0 ? styles.pnlPositive : styles.pnlNegative
                                  ]}>
                                    {parseFloat(fill.closedPnl) >= 0 ? '+' : ''}${formatDollarAmount(fill.closedPnl)}
                                  </Text>
                                )}
                              </View>
                              {fill.time && (
                                <Text style={styles.tradeTime}>
                                  {new Date(fill.time).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              )}
                            </View>
                            <View style={styles.tradeRightSide}>
                              <Text style={styles.tradePrice}>${formatPrice(parseFloat(fill.px))}</Text>
                              <Text style={styles.tradeSize}>{parseFloat(fill.sz).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</Text>
                            </View>
                          </View>
                          <View style={styles.cellSeparator} />
                        </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No trades yet</Text>
                      <Text style={styles.emptySubtext}>
                        Your trade history will appear here
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {address && viewFilter === 'Ledger' && (
            <>
              {isLoadingLedger && (
                <View style={styles.loadingContainer}>
                  <Image 
                    source={require('../../assets/blob_green.gif')} 
                    style={styles.loadingGif}
                  />
                  <Text style={styles.loadingText}>Loading ledger...</Text>
                </View>
              )}

              {ledgerError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {ledgerError}</Text>
                </View>
              )}

              {!isLoadingLedger && !ledgerError && (
                <>
                  {ledgerUpdates.length > 0 ? (
                    <View style={styles.recentTradesContainer}>
                      {ledgerUpdates.map((update: LedgerUpdate, idx: number) => (
                        <View key={`ledger-${update.hash}-${idx}`}>
                          <View style={styles.tradeCard}>
                            {renderLedgerCard(update)}
                          </View>
                          <View style={styles.cellSeparator} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No ledger activity</Text>
                      <Text style={styles.emptySubtext}>
                        Deposits, withdrawals, and transfers will appear here
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}

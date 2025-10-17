import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { styles } from './styles/HistoryScreen.styles';
import type { UserFill } from '../types';
import Color from '../styles/colors';

type MarketFilter = 'Perp' | 'Spot' | 'Perp+Spot';

const HISTORY_MARKET_FILTER_KEY = 'hl_history_market_filter';

// Helper to format numbers
function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export default function HistoryScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account } = useWallet();
  const { state: wsState } = useWebSocket();
  
  // Filter states
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Perp+Spot');
  const [tradesDisplayLimit, setTradesDisplayLimit] = useState(10);
  
  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load saved filter on mount
  useEffect(() => {
    const loadFilter = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(HISTORY_MARKET_FILTER_KEY);
        if (savedFilter && ['Perp', 'Spot', 'Perp+Spot'].includes(savedFilter)) {
          setMarketFilter(savedFilter as MarketFilter);
        }
      } catch (error) {
        console.error('[HistoryScreen] Error loading filter:', error);
      }
    };
    loadFilter();
  }, []);

  // Helper to get next/previous filter (circular navigation)
  const getNextFilter = (current: MarketFilter, direction: 'left' | 'right'): MarketFilter => {
    const filters: MarketFilter[] = ['Perp', 'Spot', 'Perp+Spot'];
    const currentIndex = filters.indexOf(current);
    
    if (direction === 'left') {
      // Swipe left: move to next
      return filters[(currentIndex + 1) % filters.length];
    } else {
      // Swipe right: move to previous
      return filters[(currentIndex - 1 + filters.length) % filters.length];
    }
  };

  // Save market filter when it changes with animation
  const handleFilterChange = async (filter: MarketFilter, animated: boolean = false, direction?: 'left' | 'right') => {
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
    
    setMarketFilter(filter);
    setTradesDisplayLimit(10); // Reset display limit when changing filter
    try {
      await AsyncStorage.setItem(HISTORY_MARKET_FILTER_KEY, filter);
    } catch (error) {
      console.error('[HistoryScreen] Error saving filter:', error);
    }
  };
  
  // Handle swipe gesture
  const handleSwipe = (direction: 'left' | 'right') => {
    const nextFilter = getNextFilter(marketFilter, direction);
    handleFilterChange(nextFilter, true, direction);
  };

  // Filter fills by market type
  const filteredFills = useMemo(() => {
    if (!account.data?.userFills) return [];
    
    const perpCoins = new Set(wsState.perpMarkets.map(m => m.name));
    const spotCoins = new Set(wsState.spotMarkets.map(m => m.name.split('/')[0]));
    
    let fills = account.data.userFills;
    
    // Filter by market type
    if (marketFilter === 'Perp') {
      fills = fills.filter(fill => perpCoins.has(fill.coin));
    } else if (marketFilter === 'Spot') {
      fills = fills.filter(fill => spotCoins.has(fill.coin));
    } else if (marketFilter === 'Perp+Spot') {
      fills = fills.filter(fill => perpCoins.has(fill.coin) || spotCoins.has(fill.coin));
    }
    
    return fills;
  }, [account.data?.userFills, marketFilter, wsState.perpMarkets, wsState.spotMarkets]);

  // Pan gesture for horizontal swipe
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Market Filter Selector */}
        <View style={styles.filterContainer}>
          <View style={styles.panelSelector}>
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => handleFilterChange('Perp')}
            >
              <Text style={[
                styles.panelText,
                marketFilter === 'Perp' && styles.panelTextActive
              ]}>
                Perp
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => handleFilterChange('Spot')}
            >
              <Text style={[
                styles.panelText,
                marketFilter === 'Spot' && styles.panelTextActive
              ]}>
                Spot
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => handleFilterChange('Perp+Spot')}
            >
              <Text style={[
                styles.panelText,
                marketFilter === 'Perp+Spot' && styles.panelTextActive
              ]}>
                Perp+Spot
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.separatorContainer}>
            <View style={[
              styles.separatorSegment,
              marketFilter === 'Perp' && styles.separatorActive
            ]} />
            <View style={[
              styles.separatorSegment,
              marketFilter === 'Spot' && styles.separatorActive
            ]} />
            <View style={[
              styles.separatorSegment,
              marketFilter === 'Perp+Spot' && styles.separatorActive
            ]} />
          </View>
        </View>

        {/* Entire content wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
              {!address && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No wallet connected</Text>
                  <Text style={styles.emptySubtext}>
                    Connect your wallet to view trade history
                  </Text>
                </View>
              )}

              {address && (
                <>
                  {account.isLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
                      <Text style={styles.loadingText}>Loading trade history...</Text>
                    </View>
                  )}

                  {account.error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>⚠️ {account.error}</Text>
                    </View>
                  )}

                  {!account.isLoading && !account.error && account.data && (
                    <>
                      {/* Recent Trades */}
                      {filteredFills.length > 0 ? (
                        <View style={styles.recentTradesContainer}>
                          <Text style={styles.sectionTitle}>
                            Recent Trades ({filteredFills.length})
                          </Text>
                          {filteredFills.slice(0, tradesDisplayLimit).map((fill: UserFill, idx: number) => (
                            <View key={`fill-${idx}`}>
                              <View style={styles.tradeCard}>
                                <View style={styles.tradeLeftSide}>
                                  <View style={styles.tradeTopRow}>
                                    <Text style={styles.tradeCoin}>{fill.coin}</Text>
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
                                        {parseFloat(fill.closedPnl) >= 0 ? '+' : ''}${parseFloat(fill.closedPnl).toFixed(2)}
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
                                  <Text style={styles.tradePrice}>${formatNumber(parseFloat(fill.px), 2)}</Text>
                                  <Text style={styles.tradeSize}>{fill.sz}</Text>
                                </View>
                              </View>
                              <View style={styles.cellSeparator} />
                            </View>
                          ))}
                          
                          {/* Show More Button */}
                          {filteredFills.length > tradesDisplayLimit && (
                            <TouchableOpacity 
                              style={styles.showMoreButton}
                              onPress={() => {
                                if (tradesDisplayLimit === 10) {
                                  setTradesDisplayLimit(20);
                                } else if (tradesDisplayLimit === 20) {
                                  setTradesDisplayLimit(50);
                                } else if (tradesDisplayLimit === 50) {
                                  setTradesDisplayLimit(filteredFills.length);
                                }
                              }}
                            >
                              <Text style={styles.showMoreText}>
                                Show More ({Math.min(
                                  tradesDisplayLimit === 10 ? 20 : 
                                  tradesDisplayLimit === 20 ? 50 : 
                                  filteredFills.length, 
                                  filteredFills.length
                                )} of {filteredFills.length})
                              </Text>
                            </TouchableOpacity>
                          )}
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
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}

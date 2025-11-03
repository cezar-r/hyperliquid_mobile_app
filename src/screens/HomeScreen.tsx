import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Animated, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice, formatSize, getDisplayTicker } from '../lib/formatting';
import { getStarredTickers } from '../lib/starredTickers';
import { playToggleHaptic, playNavToChartHaptic } from '../lib/haptics';
import { styles } from './styles/HomeScreen.styles';
import type { PerpPosition, SpotBalance } from '../types';
import Color from '../styles/colors';
import TPSLEditModal from '../components/TPSLEditModal';

type MarketFilter = 'Perp' | 'Spot' | 'Account';

const MARKET_FILTER_KEY = 'hl_home_market_filter';

// Helper to calculate PnL for a position
function calculatePositionPnL(position: PerpPosition, currentPrice: string | number): { pnl: number; pnlPercent: number } {
  const positionSize = parseFloat(position.szi);
  const entryPrice = parseFloat(position.entryPx);
  const markPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  
  if (isNaN(positionSize) || isNaN(entryPrice) || isNaN(markPrice)) {
    return { pnl: 0, pnlPercent: 0 };
  }
  
  const pnl = positionSize * (markPrice - entryPrice);
  const pnlPercent = (pnl / (Math.abs(positionSize) * entryPrice)) * 100;
  
  return { pnl, pnlPercent };
}

// Helper to format large numbers
function formatNumber(num: number, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

// Helper to format percentage
function formatPercent(num: number, decimals: number = 2): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${(num * 100).toFixed(decimals)}%`;
}

// Helper to format large numbers (for volume display)
function formatLargeNumber(num: number | undefined | null): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '$0.00';
  }
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

export default function HomeScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const navigation = useNavigation<any>();
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Account');
  const [editingTPSL, setEditingTPSL] = useState<PerpPosition | null>(null);
  
  // For starred tickers
  const [starredPerpTickers, setStarredPerpTickers] = useState<string[]>([]);
  const [starredSpotTickers, setStarredSpotTickers] = useState<string[]>([]);
  
  // For balance animation
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);
  
  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // For market filter sliding line animation
  const filterLinePosition = useRef(new Animated.Value(0)).current;

  // Load saved market filter on mount
  useEffect(() => {
    const loadMarketFilter = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(MARKET_FILTER_KEY);
        if (savedFilter && (savedFilter === 'Perp' || savedFilter === 'Spot' || savedFilter === 'Account')) {
          setMarketFilter(savedFilter as MarketFilter);
        }
      } catch (error) {
        console.error('[HomeScreen] Error loading market filter:', error);
      }
    };
    loadMarketFilter();
  }, []);

  // Load starred tickers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadStarredTickers = async () => {
        try {
          const perpStarred = await getStarredTickers('perp');
          const spotStarred = await getStarredTickers('spot');
          setStarredPerpTickers(perpStarred);
          setStarredSpotTickers(spotStarred);
        } catch (error) {
          console.error('[HomeScreen] Error loading starred tickers:', error);
        }
      };
      loadStarredTickers();
    }, [])
  );

  // Animate filter line position when market filter changes
  useEffect(() => {
    const filters: MarketFilter[] = ['Perp', 'Spot', 'Account'];
    const index = filters.indexOf(marketFilter);
    const screenWidth = require('react-native').Dimensions.get('window').width;
    const paddingHorizontal = 16; // spacing.md
    const availableWidth = screenWidth - (paddingHorizontal * 2);
    const segmentWidth = availableWidth / 3;
    
    Animated.timing(filterLinePosition, {
      toValue: index * segmentWidth,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [marketFilter, filterLinePosition]);

  // Helper to get next/previous filter (circular navigation)
  const getNextFilter = (current: MarketFilter, direction: 'left' | 'right'): MarketFilter => {
    const filters: MarketFilter[] = ['Perp', 'Spot', 'Account'];
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
    // Play haptic feedback
    playToggleHaptic();
    
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
    try {
      await AsyncStorage.setItem(MARKET_FILTER_KEY, filter);
    } catch (error) {
      console.error('[HomeScreen] Error saving market filter:', error);
    }
  };
  
  // Handle swipe gesture
  const handleSwipe = (direction: 'left' | 'right') => {
    const nextFilter = getNextFilter(marketFilter, direction);
    handleFilterChange(nextFilter, true, direction);
  };

  // Calculate perp account value
  const perpAccountValue = useMemo(() => {
    if (!account.data?.perpMarginSummary.accountValue) return 0;
    return parseFloat(account.data.perpMarginSummary.accountValue);
  }, [account.data?.perpMarginSummary.accountValue]);

  // Calculate total spot value
  const spotTotalValue = useMemo(() => {
    if (!account.data?.spotBalances) return 0;
    
    let spotValue = 0;
    account.data.spotBalances.forEach(balance => {
      const total = parseFloat(balance.total);
      // USDC is always $1
      if (balance.coin === 'USDC') {
        spotValue += total;
      } else {
        const price = wsState.prices[balance.coin];
        if (price) {
          spotValue += total * parseFloat(price);
        }
      }
    });
    return spotValue;
  }, [account.data?.spotBalances, wsState.prices]);

  // Calculate staking value
  const stakingValue = useMemo(() => {
    if (!account.data?.stakingSummary) return 0;
    
    const totalStaked = parseFloat(account.data.stakingSummary.delegated || '0') + 
                       parseFloat(account.data.stakingSummary.undelegated || '0');
    const hypePrice = wsState.prices['HYPE'] ? parseFloat(wsState.prices['HYPE']) : 0;
    
    return totalStaked * hypePrice;
  }, [account.data?.stakingSummary, wsState.prices]);

  // Calculate displayed balance based on filter
  const displayedBalance = useMemo(() => {
    if (marketFilter === 'Perp') return perpAccountValue;
    if (marketFilter === 'Spot') return spotTotalValue;
    return perpAccountValue + spotTotalValue + stakingValue;
  }, [marketFilter, perpAccountValue, spotTotalValue, stakingValue]);

  // Animate balance changes - only when there's an actual change at 2 decimal places
  useEffect(() => {
    // Round to 2 decimals for comparison
    const currentRounded = Math.round(displayedBalance * 100) / 100;
    const previousRounded = previousBalance !== null ? Math.round(previousBalance * 100) / 100 : null;
    
    if (previousRounded === null) {
      setPreviousBalance(currentRounded);
      return;
    }
    
    // Only animate if there's an actual change
    if (currentRounded !== previousRounded) {
      setIsIncrease(currentRounded > previousRounded);
      colorAnim.setValue(0);
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        })
      ]).start();
      setPreviousBalance(currentRounded);
    }
  }, [displayedBalance, colorAnim]);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Color.FG_1, isIncrease ? Color.BRIGHT_ACCENT : Color.RED]
  });

  // Get withdrawable USDC (perp tradeable balance)
  const withdrawableUsdc = useMemo(() => {
    const withdrawable = account.data?.perpMarginSummary?.withdrawable;
    if (!withdrawable) return 0;
    const amount = parseFloat(withdrawable);
    // Trim to 2 decimal places without rounding
    return Math.floor(amount * 100) / 100;
  }, [account.data?.perpMarginSummary?.withdrawable]);

  // Prepare sorted perp positions with USD values
  const sortedPerpPositions = useMemo(() => {
    if (!account.data?.perpPositions) return [];
    
    return account.data.perpPositions
      .map(position => {
        const price = wsState.prices[position.coin];
        const marginUsed = position.marginUsed 
          ? parseFloat(position.marginUsed)
          : parseFloat(position.positionValue || '0') / (position.leverage?.value || 1);
        
        return {
          position,
          price,
          marginUsed,
          pnl: price ? calculatePositionPnL(position, price) : { pnl: 0, pnlPercent: 0 },
          assetContext: wsState.assetContexts[position.coin],
        };
      })
      .sort((a, b) => b.marginUsed - a.marginUsed);
  }, [account.data?.perpPositions, wsState.prices, wsState.assetContexts]);

  // Prepare sorted spot balances with USD values
  const sortedSpotBalances = useMemo(() => {
    if (!account.data?.spotBalances) return [];
    
    return account.data.spotBalances
      .filter(balance => parseFloat(balance.total) > 0)
      .map(balance => {
        const total = parseFloat(balance.total);
        // USDC is always $1
        let price, usdValue;
        if (balance.coin === 'USDC') {
          price = '1';
          usdValue = total;
        } else {
          price = wsState.prices[balance.coin];
          usdValue = price ? total * parseFloat(price) : 0;
        }
        
        return {
          balance,
          price,
          total,
          usdValue,
          assetContext: wsState.assetContexts[balance.coin],
        };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [account.data?.spotBalances, wsState.prices, wsState.assetContexts]);

  // Prepare starred tickers with data
  const starredTickersData = useMemo(() => {
    const perpData: Array<{
      name: string;
      price: number;
      priceChange: number;
      volume: number;
      leverage: number;
      marketType: 'perp';
    }> = [];
    
    const spotData: Array<{
      name: string;
      displayName: string;
      price: number;
      priceChange: number;
      volume: number;
      marketType: 'spot';
    }> = [];

    // Process perp starred tickers
    if ((marketFilter === 'Perp' || marketFilter === 'Account') && starredPerpTickers.length > 0) {
      starredPerpTickers.forEach(ticker => {
        const ctx = wsState.assetContexts[ticker];
        const price = ctx?.markPx || 0;
        const prevPrice = ctx?.prevDayPx || price;
        const priceChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
        const volume = ctx?.dayNtlVlm || 0;
        const market = wsState.perpMarkets.find(m => m.name === ticker);
        const leverage = market?.maxLeverage || 1;

        if (price > 0 && volume > 0) {
          perpData.push({
            name: ticker,
            price,
            priceChange,
            volume,
            leverage,
            marketType: 'perp',
          });
        }
      });
    }

    // Process spot starred tickers
    if ((marketFilter === 'Spot' || marketFilter === 'Account') && starredSpotTickers.length > 0) {
      starredSpotTickers.forEach(ticker => {
        const ctx = wsState.assetContexts[ticker];
        const price = parseFloat(wsState.prices[ticker] || '0');
        const prevPrice = ctx?.prevDayPx || price;
        const priceChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
        const volume = ctx?.dayNtlVlm || 0;
        const displayName = getDisplayTicker(ticker);

        if (price > 0 && volume > 0) {
          spotData.push({
            name: ticker,
            displayName,
            price,
            priceChange,
            volume,
            marketType: 'spot',
          });
        }
      });
    }

    // Sort by volume descending
    perpData.sort((a, b) => b.volume - a.volume);
    spotData.sort((a, b) => b.volume - a.volume);

    return { perpData, spotData };
  }, [
    marketFilter,
    starredPerpTickers,
    starredSpotTickers,
    wsState.assetContexts,
    wsState.prices,
    wsState.perpMarkets,
  ]);

  // Navigate to chart detail - Set coin/market first, then navigate (like SearchScreen does)
  const handleNavigateToChart = (coin: string, market: 'perp' | 'spot') => {
    // Play haptic feedback
    playNavToChartHaptic();
    
    // Set market type first if different
    if (market !== wsState.marketType) {
      setMarketType(market);
    }
    // Then select coin
    selectCoin(coin);
    // Finally navigate without params
    navigation.navigate('ChartDetail');
  };

  // Handle close position
  const handleClosePosition = async (coin: string, size: number) => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const market = wsState.perpMarkets.find(m => m.name === coin);
    if (!market) {
      Alert.alert('Error', `Asset ${coin} not found in markets`);
      return;
    }
    
    const assetIndex = market.index;
    const szDecimals = market.szDecimals || 4;
    const currentPrice = parseFloat(wsState.prices[coin] || '0');
    
    if (!currentPrice) {
      Alert.alert('Error', `No price available for ${coin}`);
      return;
    }

    let executionPrice: number;
    if (size > 0) {
      executionPrice = currentPrice * 0.999;
    } else {
      executionPrice = currentPrice * 1.001;
    }

    Alert.alert(
      `Close ${coin} Position?`,
      `Size: ${Math.abs(size).toFixed(szDecimals)}\n` +
      `Side: ${size > 0 ? 'Sell (close long)' : 'Buy (close short)'}\n` +
      `Mid Price: $${currentPrice.toFixed(2)}\n` +
      `Execution Price: $${executionPrice.toFixed(2)} (${size > 0 ? '-0.1%' : '+0.1%'} slippage)\n\n` +
      `This will submit a reduce-only market order.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close Position',
          style: 'destructive',
          onPress: async () => {
            setClosingPosition(coin);

            try {
              const formattedPrice = formatPrice(executionPrice, szDecimals, true);
              const formattedSize = formatSize(Math.abs(size), szDecimals, currentPrice);
              
              const orderPayload = {
                orders: [{
                  a: assetIndex,
                  b: size < 0,
                  p: formattedPrice,
                  s: formattedSize,
                  r: true,
                  t: {
                    limit: { tif: 'Ioc' as const },
                  },
                }],
                grouping: 'na' as const,
              };

              console.log('[HomeScreen] Closing position:', coin);
              const result = await exchangeClient.order(orderPayload);
              console.log('[HomeScreen] ✓ Close order placed:', result);
              Alert.alert('Success', 'Position closing order submitted!');
              
              setTimeout(() => refetchAccount(), 2000);
            } catch (err: any) {
              console.error('[HomeScreen] Failed to close position:', err);
              Alert.alert('Error', `Failed to close position: ${err.message}`);
            } finally {
              setClosingPosition(null);
            }
          },
        },
      ]
    );
  };

  // Handle close all positions
  const handleCloseAll = async () => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    if (sortedPerpPositions.length === 0) {
      Alert.alert('No Positions', 'No open perp positions to close');
      return;
    }

    Alert.alert(
      'Close All Positions?',
      `Close ALL ${sortedPerpPositions.length} perp position${sortedPerpPositions.length !== 1 ? 's' : ''}?\n\nThis will close all your open perpetual positions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              let successCount = 0;
              let failCount = 0;
              
              // Close each position one by one
              for (const item of sortedPerpPositions) {
                const coin = item.position.coin;
                const size = parseFloat(item.position.szi);
                const market = wsState.perpMarkets.find(m => m.name === coin);
                
                if (!market) {
                  console.error('[HomeScreen] Market not found for:', coin);
                  failCount++;
                  continue;
                }
                
                const assetIndex = market.index;
                const szDecimals = market.szDecimals || 4;
                const currentPrice = parseFloat(wsState.prices[coin] || '0');
                
                if (!currentPrice) {
                  console.error('[HomeScreen] No price for:', coin);
                  failCount++;
                  continue;
                }

                let executionPrice: number;
                if (size > 0) {
                  executionPrice = currentPrice * 0.999;
                } else {
                  executionPrice = currentPrice * 1.001;
                }

                try {
                  // Use proper formatting functions like ChartScreen
                  const formattedPrice = formatPrice(executionPrice, szDecimals, true);
                  const formattedSize = formatSize(Math.abs(size), szDecimals, currentPrice);
                  
                  const orderPayload = {
                    orders: [{
                      a: assetIndex,
                      b: size < 0,
                      p: formattedPrice,
                      s: formattedSize,
                      r: true,
                      t: {
                        limit: { tif: 'Ioc' as const },
                      },
                    }],
                    grouping: 'na' as const,
                  };

                  console.log(`[HomeScreen] Closing position ${coin}...`);
                  await exchangeClient.order(orderPayload);
                  successCount++;
                } catch (err: any) {
                  console.error(`[HomeScreen] Failed to close ${coin}:`, err.message);
                  failCount++;
                }
              }

              console.log('[HomeScreen] Closed positions:', successCount, 'succeeded,', failCount, 'failed');
              
              if (successCount > 0) {
                Alert.alert(
                  'Positions Closed', 
                  `Successfully closed ${successCount} position${successCount !== 1 ? 's' : ''}${failCount > 0 ? `\n${failCount} failed` : ''}`
                );
              } else {
                Alert.alert('Error', 'Failed to close any positions');
              }
              
              // Refetch account data
              setTimeout(() => refetchAccount(), 2000);
            } catch (err: any) {
              console.error('[HomeScreen] Failed to close all positions:', err);
              Alert.alert('Error', `Failed to close positions: ${err.message}`);
            }
          },
        },
      ]
    );
  };

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
        {/* Market Filter Dropdown */}
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
              onPress={() => handleFilterChange('Account')}
            >
              <Text style={[
                styles.panelText,
                marketFilter === 'Account' && styles.panelTextActive
              ]}>
                Account
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

        {/* Entire page wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView}>
            <View style={styles.balanceContainer}>
              <Animated.Text style={[styles.balanceAmount, { color: textColor }]}>
                ${formatNumber(displayedBalance, 2)}
              </Animated.Text>
            </View>

        {account.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
            <Text style={styles.loadingText}>Loading account data...</Text>
          </View>
        )}

        {account.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {account.error}</Text>
          </View>
        )}

        {!account.isLoading && !account.error && account.data && (
          <View style={styles.positionsContainer}>
            {/* Perp Positions + USDC Withdrawable */}
            {(marketFilter === 'Perp' || marketFilter === 'Account') && (
              <View>
                {marketFilter === 'Account' && sortedPerpPositions.length > 0 && (
                  <View style={styles.perpsHeaderRow}>
                    <Text style={styles.sectionLabel}>Perps</Text>
                    <TouchableOpacity onPress={handleCloseAll}>
                      <Text style={styles.closeAllText}>Close All</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {marketFilter === 'Account' && sortedPerpPositions.length === 0 && (
                  <Text style={styles.sectionLabel}>Perps</Text>
                )}
                
                {/* USDC Withdrawable (Perp Account) */}
                <View style={styles.positionCell}>
                  <View style={styles.leftSide}>
                    <View style={styles.tickerContainer}>
                      <Text style={styles.ticker}>USDC</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.size}>Withdrawable</Text>
                    </View>
                  </View>
                  <View style={styles.rightSide}>
                    <Text style={styles.price}>${formatNumber(withdrawableUsdc, 2)}</Text>
                    <Text style={[styles.pnl, { color: Color.FG_3 }]}>
                      {formatNumber(withdrawableUsdc, 2)} USDC
                    </Text>
                  </View>
                </View>
                <View style={styles.separator} />
                
                {sortedPerpPositions.map((item, idx) => {
                  const positionSize = parseFloat(item.position.szi);
                  const isLong = positionSize > 0;
                  const leverage = item.position.leverage?.value || 1;
                  const leverageType = item.position.leverage?.type 
                    ? item.position.leverage.type.charAt(0).toUpperCase() + item.position.leverage.type.slice(1)
                    : 'Cross';
                  const price = item.price ? parseFloat(item.price) : 0;
                  
                  // Calculate 24h change
                  const prevDayPx = item.assetContext?.prevDayPx || price;
                  const priceChange = price - prevDayPx;
                  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                  
                  // Format TP/SL display
                  const tpDisplay = item.position.tpPrice ? item.position.tpPrice.toFixed(2) : '--';
                  const slDisplay = item.position.slPrice ? item.position.slPrice.toFixed(2) : '--';
                  
                  return (
                    <View key={`perp-${item.position.coin}`}>
                      <TouchableOpacity
                        style={styles.positionCell}
                        onPress={() => handleNavigateToChart(item.position.coin, 'perp')}
                      >
                        <View style={styles.leftSide}>
                          <View style={styles.tickerContainer}>
                            <Text style={styles.ticker}>{item.position.coin}</Text>
                            <Text style={[
                              styles.leverage,
                              { color: isLong ? Color.BRIGHT_ACCENT : Color.RED }
                            ]}>
                              {leverage}x
                            </Text>
                            <Text style={styles.leverageTypeBadge}>
                              {leverageType}
                            </Text>
                          </View>
                          <View style={styles.priceContainer}>
                            <Text style={styles.size}>${formatNumber(price)}</Text>
                            <Text style={[
                              styles.priceChange,
                              { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                            ]}>
                              {formatPercent(priceChangePct)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.rightSide}>
                          <Text style={styles.price}>${formatNumber(item.marginUsed, 2)}</Text>
                          <Text style={[
                            styles.pnl,
                            { color: item.pnl.pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                          ]}>
                            {item.pnl.pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(item.pnl.pnl), 2)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.separator} />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Spot Balances */}
            {(marketFilter === 'Spot' || marketFilter === 'Account') && sortedSpotBalances.length > 0 && (
              <View style={marketFilter === 'Account' ? styles.spotSection : undefined}>
                {marketFilter === 'Account' && (
                  <Text style={styles.balancesLabel}>Balances</Text>
                )}
                {sortedSpotBalances.map((item) => {
                  const price = item.price ? parseFloat(item.price) : 0;
                  
                  // Calculate 24h change
                  const prevDayPx = item.assetContext?.prevDayPx || price;
                  const priceChange = price - prevDayPx;
                  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                  
                  // Find the spot market for this coin to get the full pair name
                  const spotMarket = wsState.spotMarkets.find(m => m.name.split('/')[0] === item.balance.coin);
                  const displayName = spotMarket ? getDisplayTicker(spotMarket.name) : item.balance.coin;
                  
                  return (
                    <View key={`spot-${item.balance.coin}`}>
                      <TouchableOpacity
                        style={styles.positionCell}
                        onPress={() => {
                          // Don't navigate for USDC
                          if (item.balance.coin === 'USDC') return;
                          // Pass the full market name for spot (e.g., "UBTC/USDC")
                          handleNavigateToChart(spotMarket?.name || item.balance.coin, 'spot');
                        }}
                      >
                        <View style={styles.leftSide}>
                          <View style={styles.tickerContainer}>
                            <Text style={styles.ticker}>{displayName}</Text>
                          </View>
                          <View style={styles.priceContainer}>
                            <Text style={styles.size}>${formatNumber(price)}</Text>
                            <Text style={[
                              styles.priceChange,
                              { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                            ]}>
                              {formatPercent(priceChangePct)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.rightSide}>
                          <Text style={styles.price}>${formatNumber(item.usdValue, 2)}</Text>
                          <Text style={[styles.pnl, { color: Color.FG_3 }]}>
                            {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {getDisplayTicker(item.balance.coin)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.separator} />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Staking Balance */}
            {marketFilter === 'Account' && account.data?.stakingDelegations && account.data.stakingDelegations.length > 0 && (
              <View style={styles.stakingSection}>
                <Text style={styles.sectionLabel}>Staking</Text>
                {account.data.stakingDelegations.map((delegation, idx) => {
                  const delegationAmount = parseFloat(delegation.amount);
                  const hypePrice = wsState.prices['HYPE'] ? parseFloat(wsState.prices['HYPE']) : 0;
                  const usdValue = delegationAmount * hypePrice;

                  return (
                    <View key={`staking-${idx}`}>
                      <View style={styles.positionCell}>
                        <View style={styles.leftSide}>
                          <View style={styles.tickerContainer}>
                            <Text style={styles.ticker}>HYPE Foundation 1</Text>
                          </View>
                          <View style={styles.priceContainer}>
                            <Text style={styles.size}>
                              {delegationAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HYPE
                            </Text>
                          </View>
                        </View>
                        <View style={styles.rightSide}>
                          <Text style={styles.price}>${formatNumber(usdValue, 2)}</Text>
                          <Text style={[styles.pnl, { color: Color.FG_3 }]}>
                            {hypePrice > 0 ? `$${formatNumber(hypePrice, 2)} / HYPE` : '--'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.separator} />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Starred Tickers Section */}
            {(starredTickersData.perpData.length > 0 || starredTickersData.spotData.length > 0) && (
              <View style={styles.starredSection}>
                {/* Starred Perp Tickers */}
                {starredTickersData.perpData.length > 0 && (
                  <View>
                    {marketFilter === 'Account' && (
                      <View style={styles.sectionLabelWithIcon}>
                        <MaterialIcons name="star" size={16} color={Color.GOLD} style={styles.starIcon} />
                        <Text style={styles.sectionLabel}>Starred Perps</Text>
                      </View>
                    )}
                    {marketFilter === 'Perp' && (
                      <View style={styles.sectionLabelWithIcon}>
                        <MaterialIcons name="star" size={16} color={Color.GOLD} style={styles.starIcon} />
                        <Text style={styles.sectionLabel}>Starred</Text>
                      </View>
                    )}
                    {starredTickersData.perpData.map((item) => (
                      <View key={`starred-perp-${item.name}`}>
                        <TouchableOpacity
                          style={styles.positionCell}
                          onPress={() => handleNavigateToChart(item.name, 'perp')}
                        >
                          <View style={styles.leftSide}>
                            <View style={styles.tickerContainer}>
                              <Text style={styles.ticker}>{item.name}</Text>
                              <Text style={[styles.leverage, { color: Color.BRIGHT_ACCENT }]}>
                                {item.leverage}x
                              </Text>
                            </View>
                            <View style={styles.priceContainer}>
                              <Text style={[styles.size, { color: Color.FG_3 }]}>
                                {formatLargeNumber(item.volume)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.rightSide}>
                            <Text style={styles.price}>
                              ${formatNumber(item.price)}
                            </Text>
                            <Text
                              style={[
                                styles.priceChange,
                                { color: item.priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
                              ]}
                            >
                              {formatPercent(item.priceChange)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.separator} />
                      </View>
                    ))}
                  </View>
                )}

                {/* Starred Spot Tickers */}
                {starredTickersData.spotData.length > 0 && (
                  <View style={marketFilter === 'Account' && starredTickersData.perpData.length > 0 ? styles.spotSection : undefined}>
                    {marketFilter === 'Account' && (
                      <View style={[styles.sectionLabelWithIcon, { paddingTop: 6 }]}>
                        <MaterialIcons name="star" size={16} color={Color.GOLD} style={styles.starIcon} />
                        <Text style={[styles.balancesLabel, { marginBottom: 0, paddingTop: 0 }]}>Starred Spot</Text>
                      </View>
                    )}
                    {marketFilter === 'Spot' && (
                      <View style={styles.sectionLabelWithIcon}>
                        <MaterialIcons name="star" size={16} color={Color.GOLD} style={styles.starIcon} />
                        <Text style={styles.sectionLabel}>Starred</Text>
                      </View>
                    )}
                    {starredTickersData.spotData.map((item) => (
                      <View key={`starred-spot-${item.name}`}>
                        <TouchableOpacity
                          style={styles.positionCell}
                          onPress={() => handleNavigateToChart(item.name, 'spot')}
                        >
                          <View style={styles.leftSide}>
                            <View style={styles.tickerContainer}>
                              <Text style={styles.ticker}>{item.displayName}</Text>
                            </View>
                            <View style={styles.priceContainer}>
                              <Text style={[styles.size, { color: Color.FG_3 }]}>
                                {formatLargeNumber(item.volume)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.rightSide}>
                            <Text style={styles.price}>
                              ${formatNumber(item.price)}
                            </Text>
                            <Text
                              style={[
                                styles.priceChange,
                                { color: item.priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
                              ]}
                            >
                              {formatPercent(item.priceChange)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.separator} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Empty State */}
            {sortedPerpPositions.length === 0 && sortedSpotBalances.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No positions or balances</Text>
                <Text style={styles.emptySubtext}>
                  Your positions and balances will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {!account.isLoading && !account.error && !account.data && address && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No account data available yet.</Text>
            <Text style={styles.emptySubtext}>
              Data will appear after connecting your wallet.
            </Text>
          </View>
        )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
      
      {/* TP/SL Edit Modal */}
      {editingTPSL && (
        <TPSLEditModal
          visible={!!editingTPSL}
          onClose={() => setEditingTPSL(null)}
          position={editingTPSL}
          currentPrice={parseFloat(wsState.prices[editingTPSL.coin] || editingTPSL.entryPx)}
        />
      )}
    </SafeAreaView>
  );
}


import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice as formatPriceForOrder, formatSize as formatSizeForOrder, getDisplayTicker } from '../lib/formatting';
import { styles } from './styles/PortfolioScreen.styles';
import type { PerpPosition, UserFill } from '../types';
import Color from '../styles/colors';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import PerpSpotTransferModal from '../components/PerpSpotTransferModal';
import TransferToStakingModal from '../components/TransferToStakingModal';
import TransferFromStakingModal from '../components/TransferFromStakingModal';
import DelegateModal from '../components/DelegateModal';
import UndelegateModal from '../components/UndelegateModal';
import TPSLEditModal from '../components/TPSLEditModal';

type MarketFilter = 'Perp' | 'Spot' | 'Staking' | 'Perp+Spot' | 'All Markets';
type TimeFilter = '24h' | '7d' | '30d' | 'All Time';

const PORTFOLIO_MARKET_FILTER_KEY = 'hl_portfolio_market_filter';
const PORTFOLIO_TIME_FILTER_KEY = 'hl_portfolio_time_filter';

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

// Helper to format numbers
function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

// Helper to format percentage
function formatPercent(num: number, decimals: number = 2): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${(num * 100).toFixed(decimals)}%`;
}

// Helper to get time filter cutoff
function getTimeFilterCutoff(filter: TimeFilter): number | null {
  const now = Date.now();
  switch (filter) {
    case '24h':
      return now - 24 * 60 * 60 * 1000;
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    case 'All Time':
      return null;
    default:
      return null;
  }
}

export default function PortfolioScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const navigation = useNavigation<any>();
  
  // Modal states
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [perpSpotTransferVisible, setPerpSpotTransferVisible] = useState(false);
  const [transferToStakingVisible, setTransferToStakingVisible] = useState(false);
  const [transferFromStakingVisible, setTransferFromStakingVisible] = useState(false);
  const [delegateModalVisible, setDelegateModalVisible] = useState(false);
  const [undelegateModalVisible, setUndelegateModalVisible] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<{ validator: `0x${string}`; amount: string } | null>(null);
  const [editingTPSL, setEditingTPSL] = useState<PerpPosition | null>(null);

  // Filter states
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('All Markets');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [tradesDisplayLimit, setTradesDisplayLimit] = useState(10);
  const [marketDropdownVisible, setMarketDropdownVisible] = useState(false);
  
  // For value animation
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);
  
  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedMarketFilter = await AsyncStorage.getItem(PORTFOLIO_MARKET_FILTER_KEY);
        if (savedMarketFilter && ['Perp', 'Spot', 'Perp+Spot', 'Staking', 'All Markets'].includes(savedMarketFilter)) {
          setMarketFilter(savedMarketFilter as MarketFilter);
        }
        
        const savedTimeFilter = await AsyncStorage.getItem(PORTFOLIO_TIME_FILTER_KEY);
        if (savedTimeFilter && ['24h', '7d', '30d', 'All Time'].includes(savedTimeFilter)) {
          setTimeFilter(savedTimeFilter as TimeFilter);
        }
      } catch (error) {
        console.error('[PortfolioScreen] Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Save market filter when it changes
  const handleMarketFilterChange = async (filter: MarketFilter) => {
    setMarketFilter(filter);
    setMarketDropdownVisible(false);
    try {
      await AsyncStorage.setItem(PORTFOLIO_MARKET_FILTER_KEY, filter);
    } catch (error) {
      console.error('[PortfolioScreen] Error saving market filter:', error);
    }
  };

  // Helper to get next/previous time filter (circular navigation)
  const getNextTimeFilter = (current: TimeFilter, direction: 'left' | 'right'): TimeFilter => {
    const filters: TimeFilter[] = ['24h', '7d', '30d', 'All Time'];
    const currentIndex = filters.indexOf(current);
    
    if (direction === 'left') {
      // Swipe left: move to next
      return filters[(currentIndex + 1) % filters.length];
    } else {
      // Swipe right: move to previous
      return filters[(currentIndex - 1 + filters.length) % filters.length];
    }
  };

  // Save time filter when it changes with animation
  const handleTimeFilterChange = async (filter: TimeFilter, animated: boolean = false, direction?: 'left' | 'right') => {
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
    
    setTimeFilter(filter);
    setTradesDisplayLimit(10); // Reset display limit when changing time filter
    try {
      await AsyncStorage.setItem(PORTFOLIO_TIME_FILTER_KEY, filter);
    } catch (error) {
      console.error('[PortfolioScreen] Error saving time filter:', error);
    }
  };
  
  // Handle swipe gesture for time filter
  const handleTimeSwipe = (direction: 'left' | 'right') => {
    const nextFilter = getNextTimeFilter(timeFilter, direction);
    handleTimeFilterChange(nextFilter, true, direction);
  };

  // Filter fills by time period and market type
  const filteredFills = useMemo(() => {
    if (!account.data?.userFills) return [];
    
    const cutoff = getTimeFilterCutoff(timeFilter);
    const perpCoins = new Set(wsState.perpMarkets.map(m => m.name));
    const spotCoins = new Set(wsState.spotMarkets.map(m => m.name.split('/')[0]));
    
    let fills = account.data.userFills;
    
    // Filter by time
    if (cutoff !== null) {
      fills = fills.filter(fill => fill.time >= cutoff);
    }
    
    // Filter by market type
    if (marketFilter === 'Perp') {
      fills = fills.filter(fill => perpCoins.has(fill.coin));
    } else if (marketFilter === 'Spot') {
      fills = fills.filter(fill => spotCoins.has(fill.coin));
    } else if (marketFilter === 'Perp+Spot') {
      fills = fills.filter(fill => perpCoins.has(fill.coin) || spotCoins.has(fill.coin));
    } else if (marketFilter === 'Staking') {
      fills = []; // No fills for staking
    }
    // 'All Markets' shows all fills
    
    return fills;
  }, [account.data?.userFills, timeFilter, marketFilter, wsState.perpMarkets, wsState.spotMarkets]);

  // Helper to check if a fill is a spot trade
  const isSpotFill = useCallback((coin: string) => {
    return wsState.spotMarkets.some(m => m.name.split('/')[0] === coin);
  }, [wsState.spotMarkets]);

  // Calculate trading volume for perp trades
  const tradingVolume = useMemo(() => {
    if (!account.data?.userFills || marketFilter === 'Staking') return null;
    
    // For Perp, Perp+Spot, All, show volume. For Spot, we can show it too
    const volume = filteredFills.reduce((sum, fill) => {
      const fillVolume = parseFloat(fill.sz) * parseFloat(fill.px);
      return sum + fillVolume;
    }, 0);
    
    return volume;
  }, [filteredFills, marketFilter]);

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

  // Calculate total portfolio value and PnL based on market filter
  const { totalValue, unrealizedPnL, realizedPnL, totalPnL, showPnL } = useMemo(() => {
    if (!account.data) return { totalValue: 0, unrealizedPnL: 0, realizedPnL: 0, totalPnL: 0, showPnL: false };
    
    let value = 0;
    let uPnl = 0;
    let shouldShowPnL = false;
    
    // Calculate value and PnL based on market filter
    if (marketFilter === 'Perp') {
      value = perpAccountValue;
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach(position => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          uPnl += posPnl;
        }
      });
    } else if (marketFilter === 'Spot') {
      value = spotTotalValue;
      shouldShowPnL = true;
      // Spot positions don't have unrealized PnL in the same way
    } else if (marketFilter === 'Staking') {
      value = stakingValue;
      shouldShowPnL = false; // No PnL for staking
    } else if (marketFilter === 'Perp+Spot') {
      value = perpAccountValue + spotTotalValue;
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach(position => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          uPnl += posPnl;
        }
      });
    } else { // All
      value = perpAccountValue + spotTotalValue + stakingValue;
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach(position => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          uPnl += posPnl;
        }
      });
    }
    
    // Calculate realized PnL from filtered fills
    const rPnl = filteredFills.reduce((sum, fill) => {
      const closedPnl = parseFloat(fill.closedPnl || '0');
      return sum + closedPnl;
    }, 0);
    
    const totalPnl = uPnl + rPnl;
    
    return { 
      totalValue: value, 
      unrealizedPnL: uPnl, 
      realizedPnL: rPnl, 
      totalPnL: totalPnl,
      showPnL: shouldShowPnL
    };
  }, [account.data, wsState.prices, perpAccountValue, spotTotalValue, stakingValue, filteredFills, marketFilter]);

  // Animate value changes - only when there's an actual change at 2 decimal places
  useEffect(() => {
    // Round to 2 decimals for comparison
    const currentRounded = Math.round(totalValue * 100) / 100;
    const previousRounded = previousValue !== null ? Math.round(previousValue * 100) / 100 : null;
    
    if (previousRounded === null) {
      setPreviousValue(currentRounded);
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
      setPreviousValue(currentRounded);
    }
  }, [totalValue, colorAnim]);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Color.FG_1, isIncrease ? Color.BRIGHT_ACCENT : Color.RED]
  });

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

  // Navigate to chart detail
  const handleNavigateToChart = (coin: string, market: 'perp' | 'spot') => {
    if (market !== wsState.marketType) {
      setMarketType(market);
    }
    selectCoin(coin);
    navigation.navigate('ChartDetail');
  };

  // Handle cancel all orders
  const handleCancelAll = async () => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    if (!account.data) {
      Alert.alert('Error', 'Account data not loaded');
      return;
    }

    // Get filtered orders (defined in the JSX section below)
    const perpCoins = new Set(wsState.perpMarkets.map(m => m.name));
    const spotCoins = new Set(wsState.spotMarkets.map(m => m.name.split('/')[0]));
    
    const getOrderMarketType = (coin: string): 'perp' | 'spot' | null => {
      const perpMarket = wsState.perpMarkets.find(m => m.name === coin);
      if (perpMarket) return 'perp';
      
      const spotMarket = wsState.spotMarkets.find(m => m.name === coin || m.apiName === coin);
      if (spotMarket) return 'spot';
      
      return null;
    };
    
    const filteredOrders = account.data.openOrders.filter((order: any) => {
      const orderMarketType = getOrderMarketType(order.coin);
      
      if (marketFilter === 'Perp') {
        return orderMarketType === 'perp';
      } else if (marketFilter === 'Spot') {
        return orderMarketType === 'spot';
      } else if (marketFilter === 'Perp+Spot') {
        return orderMarketType === 'perp' || orderMarketType === 'spot';
      } else if (marketFilter === 'All Markets') {
        return orderMarketType === 'perp' || orderMarketType === 'spot';
      } else if (marketFilter === 'Staking') {
        return false;
      }
      return false;
    });

    if (filteredOrders.length === 0) {
      Alert.alert('No Orders', 'No open orders to cancel');
      return;
    }

    Alert.alert(
      'Cancel All Orders?',
      `Cancel ALL ${filteredOrders.length} open order${filteredOrders.length !== 1 ? 's' : ''}?\n\nThis will cancel all your visible open limit orders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // Build cancels array with asset index and order ID for each order
              const cancels = filteredOrders.map((order: any) => {
                const perpMarket = wsState.perpMarkets.find(m => m.name === order.coin);
                const spotMarket = wsState.spotMarkets.find(m => m.name === order.coin || m.apiName === order.coin);
                
                let assetIndex: number;
                if (perpMarket) {
                  assetIndex = perpMarket.index;
                } else if (spotMarket) {
                  assetIndex = 10000 + spotMarket.index;
                } else {
                  console.error('[PortfolioScreen] Market not found for order:', order.coin);
                  assetIndex = 0; // Fallback
                }
                
                return {
                  a: assetIndex,
                  o: order.oid,
                };
              });

              console.log('[PortfolioScreen] Canceling all orders:', cancels.length);
              console.log('[PortfolioScreen] Cancel payload:', JSON.stringify({ cancels }, null, 2));

              await exchangeClient.cancel({ cancels });
              
              Alert.alert('Success', `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} canceled successfully!`);
              
              // Refetch account data
              setTimeout(() => refetchAccount(), 1000);
            } catch (err: any) {
              console.error('[PortfolioScreen] Failed to cancel all orders:', err);
              Alert.alert('Error', `Failed to cancel orders: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  // Handle close all perp positions
  const handleCloseAllPositions = async () => {
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
                  console.error('[PortfolioScreen] Market not found for:', coin);
                  failCount++;
                  continue;
                }
                
                const assetIndex = market.index;
                const szDecimals = market.szDecimals || 4;
                const currentPrice = parseFloat(wsState.prices[coin] || '0');
                
                if (!currentPrice) {
                  console.error('[PortfolioScreen] No price for:', coin);
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
                  const formattedPrice = formatPriceForOrder(executionPrice, szDecimals, true);
                  const formattedSize = formatSizeForOrder(Math.abs(size), szDecimals, currentPrice);
                  
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

                  console.log(`[PortfolioScreen] Closing position ${coin}...`);
                  await exchangeClient.order(orderPayload);
                  successCount++;
                } catch (err: any) {
                  console.error(`[PortfolioScreen] Failed to close ${coin}:`, err.message);
                  failCount++;
                }
              }

              console.log('[PortfolioScreen] Closed positions:', successCount, 'succeeded,', failCount, 'failed');
              
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
              console.error('[PortfolioScreen] Failed to close all positions:', err);
              Alert.alert('Error', `Failed to close positions: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  // Check what to show based on market filter
  const showPerps = ['Perp', 'Perp+Spot', 'All Markets'].includes(marketFilter);
  const showSpot = ['Spot', 'Perp+Spot', 'All Markets'].includes(marketFilter);
  const showStaking = ['Staking', 'All Markets'].includes(marketFilter);
  const showEquityBreakdown = ['Perp+Spot', 'All Markets', 'Staking'].includes(marketFilter);

  // Pan gesture for horizontal swipe (timeframes)
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { velocityX, translationX } = event;
      
      // Check if gesture is predominantly horizontal and fast enough
      if (Math.abs(velocityX) > 500 || Math.abs(translationX) > 100) {
        if (translationX < -50) {
          // Swipe left
          runOnJS(handleTimeSwipe)('left');
        } else if (translationX > 50) {
          // Swipe right
          runOnJS(handleTimeSwipe)('right');
        }
      }
    })
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Time Period Filter */}
          <View style={styles.timeFilterContainer}>
            <View style={styles.timeFilterSelector}>
              <TouchableOpacity
                style={styles.timeFilterButton}
                onPress={() => handleTimeFilterChange('24h')}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeFilter === '24h' && styles.timeFilterTextActive
                ]}>
                  24h
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeFilterButton}
                onPress={() => handleTimeFilterChange('7d')}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeFilter === '7d' && styles.timeFilterTextActive
                ]}>
                  7d
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeFilterButton}
                onPress={() => handleTimeFilterChange('30d')}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeFilter === '30d' && styles.timeFilterTextActive
                ]}>
                  30d
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeFilterButton}
                onPress={() => handleTimeFilterChange('All Time')}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeFilter === 'All Time' && styles.timeFilterTextActive
                ]}>
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeSeparatorContainer}>
              <View style={[
                styles.timeSeparatorSegment,
                timeFilter === '24h' && styles.timeSeparatorActive
              ]} />
              <View style={[
                styles.timeSeparatorSegment,
                timeFilter === '7d' && styles.timeSeparatorActive
              ]} />
              <View style={[
                styles.timeSeparatorSegment,
                timeFilter === '30d' && styles.timeSeparatorActive
              ]} />
              <View style={[
                styles.timeSeparatorSegment,
                timeFilter === 'All Time' && styles.timeSeparatorActive
              ]} />
            </View>
          </View>

        {/* Entire content wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

          {/* Market Filter Dropdown */}
          <View style={styles.marketDropdownContainer}>
            <TouchableOpacity 
              style={styles.marketDropdownButton}
              onPress={() => setMarketDropdownVisible(!marketDropdownVisible)}
            >
              <Text style={styles.marketDropdownButtonText}>{marketFilter}</Text>
              <Text style={styles.marketDropdownArrow}>{marketDropdownVisible ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>

          {/* Separator below market dropdown */}
          <View style={styles.separator} />

          {!address && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No wallet connected</Text>
              <Text style={styles.emptySubtext}>
                Connect your wallet to view portfolio
              </Text>
            </View>
          )}

          {address && (
            <>
              {account.isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
                  <Text style={styles.loadingText}>Loading portfolio data...</Text>
                </View>
              )}

              {account.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {account.error}</Text>
                </View>
              )}

              {!account.isLoading && !account.error && account.data && (
                <>
                  {/* Trading Volume Display */}
                  {tradingVolume !== null && (
                    <View style={styles.volumeContainer}>
                      <Text style={styles.volumeLabel}>Trading Volume</Text>
                      <Text style={styles.volumeValue}>${formatNumber(tradingVolume, 2)}</Text>
                    </View>
                  )}

                  {/* Portfolio Value */}
                  <View style={styles.portfolioValueContainer}>
                    <Animated.Text style={[styles.portfolioValue, { color: textColor }]}>${formatNumber(totalValue, 2)}</Animated.Text>
                    {showPnL && totalPnL !== 0 && (
                      <Text style={[
                        styles.portfolioPnL,
                        totalPnL >= 0 ? styles.pnlPositive : styles.pnlNegative
                      ]}>
                        {totalPnL >= 0 ? '+' : ''}${formatNumber(totalPnL, 2)} {timeFilter}
                      </Text>
                    )}
                    
                    {/* Equity Breakdown */}
                    {showEquityBreakdown && (
                      <View style={styles.equityBreakdownContainer}>
                        {(showPerps || marketFilter === 'All Markets') && perpAccountValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Perp</Text>
                            <Text style={styles.equityValue}>${formatNumber(perpAccountValue, 2)}</Text>
                          </View>
                        )}
                        {(showSpot || marketFilter === 'All Markets') && spotTotalValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Spot</Text>
                            <Text style={styles.equityValue}>${formatNumber(spotTotalValue, 2)}</Text>
                          </View>
                        )}
                        {(showStaking && (marketFilter === 'All Markets' || marketFilter !== 'Staking')) && stakingValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Staking</Text>
                            <Text style={styles.equityValue}>${formatNumber(stakingValue, 2)}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Conditional rendering based on market filter */}
                  {marketFilter === 'Perp' ? (
                    <>
                      {/* Perp Positions - render first when Perp filter is selected */}
                      {showPerps && sortedPerpPositions.length > 0 && (
                        <View style={styles.positionsContainer}>
                          <View style={styles.ordersHeaderRow}>
                            <Text style={styles.sectionLabel}>
                              Perps ({sortedPerpPositions.length})
                            </Text>
                            <TouchableOpacity onPress={handleCloseAllPositions}>
                              <Text style={styles.cancelAllText}>Close All</Text>
                            </TouchableOpacity>
                          </View>
                          {sortedPerpPositions.map((item, idx) => {
                            const positionSize = parseFloat(item.position.szi);
                            const isLong = positionSize > 0;
                            const leverage = item.position.leverage?.value || 1;
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
                                    </View>
                                    <View style={styles.priceContainer}>
                                      <Text style={styles.size}>${formatNumber(price)}</Text>
                                      <Text style={[
                                        styles.priceChange,
                                        { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                                      ]}>
                                        {formatPercent(priceChangePct)}
                                      </Text>
                                      <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          setEditingTPSL(item.position);
                                        }}
                                      >
                                        <Text style={styles.tpslInline}>TP/SL {tpDisplay}/{slDisplay}</Text>
                                        <MaterialIcons name="edit" size={14} color={Color.BRIGHT_ACCENT} style={styles.editTpslIcon} />
                                      </TouchableOpacity>
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
                                <View style={styles.cellSeparator} />
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Account Details - render second when Perp filter is selected */}
                      {showPerps && (
                        <>
                          <View style={styles.accountDetailsContainer}>
                            <Text style={styles.accountDetailsTitle}>Account Details</Text>
                          
                          {account.data.perpMarginSummary.accountValue && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Perp Account Value</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.accountValue).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.withdrawable && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Withdrawable</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.withdrawable).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.totalMarginUsed && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Margin Used</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.totalMarginUsed).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                            <View style={styles.separator} />
                            
                            {/* Deposit and Withdraw Buttons */}
                            <View style={styles.actionButtonsContainer}>
                              <TouchableOpacity 
                                style={styles.depositButton}
                                onPress={() => setDepositModalVisible(true)}
                              >
                                <Text style={styles.depositButtonText}>Deposit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.withdrawButton}
                                onPress={() => setWithdrawModalVisible(true)}
                              >
                                <Text style={styles.withdrawButtonText}>Withdraw</Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Perp <-> Spot Transfer Button */}
                            <View style={styles.transferContainer}>
                              <TouchableOpacity 
                                style={styles.transferButton}
                                onPress={() => setPerpSpotTransferVisible(true)}
                              >
                                <Text style={styles.transferButtonText}>Perp ↔ Spot Transfer</Text>
                              </TouchableOpacity>
                            </View>
                            
                            <View style={styles.separator} />
                          </View>
                        </>
                      )}
                    </>
                  ) : marketFilter === 'Spot' ? (
                    <>
                      {/* Spot Balances - render first when Spot filter is selected */}
                      {showSpot && sortedSpotBalances.length > 0 && (
                        <View style={styles.positionsContainer}>
                          <Text style={styles.sectionLabel}>
                            Balances ({sortedSpotBalances.length})
                          </Text>
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
                                      {formatNumber(item.total, 4)} {getDisplayTicker(item.balance.coin)}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                                <View style={styles.cellSeparator} />
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Account Details - render second when Spot filter is selected */}
                      {showSpot && (
                        <>
                          <View style={styles.accountDetailsContainer}>
                            <Text style={styles.accountDetailsTitle}>Account Details</Text>
                          
                          {account.data.perpMarginSummary.accountValue && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Perp Account Value</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.accountValue).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.withdrawable && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Withdrawable</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.withdrawable).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.totalMarginUsed && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Margin Used</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.totalMarginUsed).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                            <View style={styles.separator} />
                            
                            {/* Deposit and Withdraw Buttons */}
                            <View style={styles.actionButtonsContainer}>
                              <TouchableOpacity 
                                style={styles.depositButton}
                                onPress={() => setDepositModalVisible(true)}
                              >
                                <Text style={styles.depositButtonText}>Deposit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.withdrawButton}
                                onPress={() => setWithdrawModalVisible(true)}
                              >
                                <Text style={styles.withdrawButtonText}>Withdraw</Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Perp <-> Spot Transfer Button */}
                            <View style={styles.transferContainer}>
                              <TouchableOpacity 
                                style={styles.transferButton}
                                onPress={() => setPerpSpotTransferVisible(true)}
                              >
                                <Text style={styles.transferButtonText}>Perp ↔ Spot Transfer</Text>
                              </TouchableOpacity>
                            </View>
                            
                            <View style={styles.separator} />
                          </View>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Default order: Account Details → Perps → Spot Balances */}
                      {/* Account Details */}
                      {(showPerps || showSpot || marketFilter === 'Perp+Spot' || marketFilter === 'All Markets') && (
                        <>
                          <View style={styles.separator} />
                          <View style={styles.accountDetailsContainer}>
                            <Text style={styles.accountDetailsTitle}>Account Details</Text>
                          
                          {account.data.perpMarginSummary.accountValue && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Perp Account Value</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.accountValue).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.withdrawable && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Withdrawable</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.withdrawable).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                          {account.data.perpMarginSummary.totalMarginUsed && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Margin Used</Text>
                              <Text style={styles.detailValue}>
                                ${parseFloat(account.data.perpMarginSummary.totalMarginUsed).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          
                            <View style={styles.separator} />
                            
                            {/* Deposit and Withdraw Buttons */}
                            <View style={styles.actionButtonsContainer}>
                              <TouchableOpacity 
                                style={styles.depositButton}
                                onPress={() => setDepositModalVisible(true)}
                              >
                                <Text style={styles.depositButtonText}>Deposit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.withdrawButton}
                                onPress={() => setWithdrawModalVisible(true)}
                              >
                                <Text style={styles.withdrawButtonText}>Withdraw</Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Perp <-> Spot Transfer Button */}
                            <View style={styles.transferContainer}>
                              <TouchableOpacity 
                                style={styles.transferButton}
                                onPress={() => setPerpSpotTransferVisible(true)}
                              >
                                <Text style={styles.transferButtonText}>Perp ↔ Spot Transfer</Text>
                              </TouchableOpacity>
                            </View>
                            
                            <View style={styles.separator} />
                          </View>
                        </>
                      )}

                      {/* Open Positions */}
                      {showPerps && sortedPerpPositions.length > 0 && (
                        <View style={styles.positionsContainer}>
                          <View style={styles.ordersHeaderRow}>
                            <Text style={styles.sectionLabel}>
                              Perps ({sortedPerpPositions.length})
                            </Text>
                            <TouchableOpacity onPress={handleCloseAllPositions}>
                              <Text style={styles.cancelAllText}>Close All</Text>
                            </TouchableOpacity>
                          </View>
                          {sortedPerpPositions.map((item, idx) => {
                            const positionSize = parseFloat(item.position.szi);
                            const isLong = positionSize > 0;
                            const leverage = item.position.leverage?.value || 1;
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
                                    </View>
                                    <View style={styles.priceContainer}>
                                      <Text style={styles.size}>${formatNumber(price)}</Text>
                                      <Text style={[
                                        styles.priceChange,
                                        { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                                      ]}>
                                        {formatPercent(priceChangePct)}
                                      </Text>
                                      <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          setEditingTPSL(item.position);
                                        }}
                                      >
                                        <Text style={styles.tpslInline}>TP/SL {tpDisplay}/{slDisplay}</Text>
                                        <MaterialIcons name="edit" size={14} color={Color.BRIGHT_ACCENT} style={styles.editTpslIcon} />
                                      </TouchableOpacity>
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
                                <View style={styles.cellSeparator} />
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Spot Balances */}
                      {showSpot && sortedSpotBalances.length > 0 && (
                        <View style={styles.positionsContainer}>
                          <Text style={styles.sectionLabel}>
                            Balances ({sortedSpotBalances.length})
                          </Text>
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
                                      {formatNumber(item.total, 4)} {getDisplayTicker(item.balance.coin)}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                                <View style={styles.cellSeparator} />
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}

                  {/* Open Orders - Filtered by market type */}
                  {(() => {
                    const perpCoins = new Set(wsState.perpMarkets.map(m => m.name));
                    const spotCoins = new Set(wsState.spotMarkets.map(m => m.name.split('/')[0]));
                    
                    // Helper to detect market type for an order
                    const getOrderMarketType = (coin: string): 'perp' | 'spot' | null => {
                      const perpMarket = wsState.perpMarkets.find(m => m.name === coin);
                      if (perpMarket) return 'perp';
                      
                      // For spot, check both display name and apiName (@{index})
                      const spotMarket = wsState.spotMarkets.find(m => m.name === coin || m.apiName === coin);
                      if (spotMarket) return 'spot';
                      
                      return null;
                    };
                    
                    // Helper to get display name for spot orders (converts @{index} to display name)
                    const getDisplayName = (coin: string) => {
                      const spotMarket = wsState.spotMarkets.find(m => m.name === coin || m.apiName === coin);
                      if (spotMarket) return spotMarket.name;
                      return coin;
                    };
                    
                    // Filter orders by market type
                    const filteredOrders = account.data.openOrders.filter((order: any) => {
                      const orderMarketType = getOrderMarketType(order.coin);
                      
                      // Debug logging
                      if (marketFilter === 'All Markets') {
                        console.log('[PortfolioScreen] Order:', order.coin, 'Type:', orderMarketType);
                      }
                      
                      if (marketFilter === 'Perp') {
                        return orderMarketType === 'perp';
                      } else if (marketFilter === 'Spot') {
                        return orderMarketType === 'spot';
                      } else if (marketFilter === 'Perp+Spot') {
                        return orderMarketType === 'perp' || orderMarketType === 'spot';
                      } else if (marketFilter === 'All Markets') {
                        // For 'All Markets', show both perp and spot orders
                        return orderMarketType === 'perp' || orderMarketType === 'spot';
                      } else if (marketFilter === 'Staking') {
                        return false; // No orders for staking
                      }
                      return false;
                    });
                    
                    return filteredOrders.length > 0 && (
                      <View style={styles.positionsContainer}>
                        <View style={styles.ordersHeaderRow}>
                          <Text style={styles.sectionLabel}>
                            Open Orders ({filteredOrders.length})
                          </Text>
                          <TouchableOpacity onPress={handleCancelAll}>
                            <Text style={styles.cancelAllText}>Cancel All</Text>
                          </TouchableOpacity>
                        </View>
                        {filteredOrders.slice(0, 10).map((order: any, idx: number) => {
                          const orderMarketType = getOrderMarketType(order.coin);
                          const displayName = getDisplayName(order.coin);
                          
                          return (
                            <View key={`order-${idx}-${order.oid}`}>
                              <View style={styles.orderCard}>
                                <TouchableOpacity
                                  style={styles.orderLeftSide}
                                  onPress={() => {
                                    if (orderMarketType) {
                                      handleNavigateToChart(order.coin, orderMarketType);
                                    }
                                  }}
                                >
                                  <View style={styles.orderCoinContainer}>
                                    <Text style={styles.orderCoin}>{displayName}</Text>
                                    <Text style={[
                                      styles.orderSide,
                                      order.side === 'B' ? styles.sideBuy : styles.sideSell
                                    ]}>
                                      {order.side === 'B' ? 'BUY' : 'SELL'}
                                    </Text>
                                  </View>
                                  <View style={styles.orderDetails}>
                                    <Text style={styles.orderPrice}>${order.limitPx}</Text>
                                    <Text style={styles.orderSize}>{order.sz}</Text>
                                  </View>
                                </TouchableOpacity>
                                <View style={styles.orderRightSide}>
                                  <TouchableOpacity
                                    style={styles.cancelOrderButton}
                                    onPress={async () => {
                                    if (!exchangeClient) {
                                      Alert.alert('Error', 'Wallet not connected');
                                      return;
                                    }

                                    // Get market info
                                    const perpMarket = wsState.perpMarkets.find(m => m.name === order.coin);
                                    const spotMarket = wsState.spotMarkets.find(m => m.name === order.coin || m.apiName === order.coin);
                                    
                                    let assetIndex: number;
                                    if (orderMarketType === 'perp' && perpMarket) {
                                      assetIndex = perpMarket.index;
                                    } else if (orderMarketType === 'spot' && spotMarket) {
                                      assetIndex = 10000 + spotMarket.index;
                                    } else {
                                      Alert.alert('Error', `Asset ${order.coin} not found`);
                                      return;
                                    }

                                    Alert.alert(
                                      `Cancel Order?`,
                                      `${displayName}\n${order.side === 'B' ? 'BUY' : 'SELL'} ${order.sz} @ $${order.limitPx}`,
                                      [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                          text: 'Confirm',
                                          style: 'destructive',
                                          onPress: async () => {
                                            try {
                                              await exchangeClient.cancel({
                                                cancels: [{ a: assetIndex, o: order.oid }],
                                              });
                                              Alert.alert('Success', 'Order canceled');
                                              setTimeout(() => refetchAccount(), 1000);
                                            } catch (err: any) {
                                              Alert.alert('Error', `Failed: ${err.message}`);
                                            }
                                          },
                                        },
                                      ]
                                    );
                                  }}
                                >
                                    <Text style={styles.cancelOrderButtonText}>Cancel</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <View style={styles.cellSeparator} />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}

                  {/* Staking Section */}
                  {showStaking && (
                    <View style={styles.stakingSection}>
                      {marketFilter === 'All Markets' && (
                        <Text style={styles.sectionLabel}>Staking</Text>
                      )}
                      <View style={styles.stakingCard}>
                        {/* Staking Summary */}
                        <View style={styles.stakingSummaryRow}>
                          <View style={styles.stakingSummaryItem}>
                            <Text style={styles.stakingLabel}>Total Staked</Text>
                            <Text style={styles.stakingValue}>
                              {account.data.stakingSummary 
                                ? (parseFloat(account.data.stakingSummary.delegated || '0') + 
                                   parseFloat(account.data.stakingSummary.undelegated || '0')).toFixed(2)
                                : '0.00'} HYPE
                            </Text>
                            {account.data.stakingSummary && (
                              <Text style={styles.stakingSubtext}>
                                Delegated: {parseFloat(account.data.stakingSummary.delegated || '0').toFixed(2)} HYPE
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.stakingSummaryItem}>
                            <Text style={styles.stakingLabel}>Spot Balance</Text>
                            <Text style={styles.stakingValue}>
                              {(() => {
                                const hypeBalance = account.data.spotBalances.find(b => b.coin === 'HYPE');
                                return hypeBalance ? parseFloat(hypeBalance.total).toFixed(2) : '0.00';
                              })()} HYPE
                            </Text>
                            <Text style={styles.stakingSubtext}>Available to stake</Text>
                          </View>
                        </View>

                        <View style={styles.stakingSummaryRow}>
                          <View style={styles.stakingSummaryItem}>
                            <Text style={styles.stakingLabel}>Available to Delegate</Text>
                            <Text style={styles.stakingValue}>
                              {account.data.stakingSummary 
                                ? parseFloat(account.data.stakingSummary.undelegated || '0').toFixed(2)
                                : '0.00'} HYPE
                            </Text>
                            <Text style={styles.stakingSubtext}>In staking balance</Text>
                          </View>

                          <View style={styles.stakingSummaryItem}>
                            <Text style={styles.stakingLabel}>Pending Transfers</Text>
                            <Text style={styles.stakingValue}>
                              {account.data.stakingSummary 
                                ? parseFloat(account.data.stakingSummary.totalPendingWithdrawal || '0').toFixed(2)
                                : '0.00'} HYPE
                            </Text>
                            <Text style={styles.stakingSubtext}>
                              {account.data.stakingSummary?.nPendingWithdrawals || 0} pending
                            </Text>
                          </View>
                        </View>

                        {/* Transfer Buttons */}
                        <View style={styles.stakingButtons}>
                          <TouchableOpacity 
                            style={styles.depositButton}
                            onPress={() => setTransferToStakingVisible(true)}
                            disabled={!account.data.spotBalances.find(b => b.coin === 'HYPE') || 
                                      parseFloat(account.data.spotBalances.find(b => b.coin === 'HYPE')?.total || '0') <= 0}
                          >
                            <Text style={styles.depositButtonText}>Transfer to Staking</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.withdrawButton}
                            onPress={() => setTransferFromStakingVisible(true)}
                            disabled={!account.data.stakingSummary || 
                                      parseFloat(account.data.stakingSummary.undelegated || '0') <= 0}
                          >
                            <Text style={styles.withdrawButtonText}>Transfer to Spot</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Delegate Button */}
                        {account.data.stakingSummary && parseFloat(account.data.stakingSummary.undelegated || '0') > 0 && (
                          <TouchableOpacity 
                            style={styles.delegateButton}
                            onPress={() => setDelegateModalVisible(true)}
                          >
                            <Text style={styles.delegateButtonText}>Delegate to Validator</Text>
                          </TouchableOpacity>
                        )}

                        {/* Delegations List */}
                        {account.data.stakingDelegations.length > 0 && (
                          <View style={styles.delegationsContainer}>
                            <Text style={styles.delegationsTitle}>Active Delegations</Text>
                            {account.data.stakingDelegations.map((delegation, idx) => (
                              <View key={`delegation-${idx}`} style={styles.delegationCard}>
                                <View style={styles.delegationHeader}>
                                  <Text style={styles.delegationValidator}>HYPE Foundation 1</Text>
                                  <Text style={styles.delegationAmount}>
                                    {parseFloat(delegation.amount).toFixed(2)} HYPE
                                  </Text>
                                </View>
                                <Text style={styles.delegationAddress}>
                                  {delegation.validator.slice(0, 10)}...{delegation.validator.slice(-8)}
                                </Text>
                                <TouchableOpacity 
                                  style={styles.undelegateButton}
                                  onPress={() => {
                                    setSelectedDelegation({
                                      validator: delegation.validator,
                                      amount: delegation.amount,
                                    });
                                    setUndelegateModalVisible(true);
                                  }}
                                >
                                  <Text style={styles.undelegateButtonText}>Undelegate</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Recent Trades */}
                  {filteredFills.length > 0 && (
                    <View style={styles.recentTradesContainer}>
                      <Text style={styles.sectionLabel}>
                        Recent Trades ({filteredFills.length})
                      </Text>
                      {filteredFills.slice(0, tradesDisplayLimit).map((fill: UserFill, idx: number) => {
                        const displayCoin = isSpotFill(fill.coin) ? getDisplayTicker(fill.coin) : fill.coin;
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
                        );
                      })}
                      
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
                  )}
                </>
              )}
            </>
          )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
      
      {/* Dropdown Backdrop and Menu - rendered at top level for proper z-index */}
      {marketDropdownVisible && (
        <>
          <TouchableOpacity 
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setMarketDropdownVisible(false)}
          />
          <View style={styles.marketDropdownMenuOverlay}>
            <TouchableOpacity 
              style={styles.marketDropdownItem}
              onPress={() => handleMarketFilterChange('Perp')}
            >
              <Text style={[
                styles.marketDropdownItemText,
                marketFilter === 'Perp' && styles.marketDropdownItemTextActive
              ]}>Perp</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.marketDropdownItem}
              onPress={() => handleMarketFilterChange('Spot')}
            >
              <Text style={[
                styles.marketDropdownItemText,
                marketFilter === 'Spot' && styles.marketDropdownItemTextActive
              ]}>Spot</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.marketDropdownItem}
              onPress={() => handleMarketFilterChange('Staking')}
            >
              <Text style={[
                styles.marketDropdownItemText,
                marketFilter === 'Staking' && styles.marketDropdownItemTextActive
              ]}>Staking</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.marketDropdownItem}
              onPress={() => handleMarketFilterChange('Perp+Spot')}
            >
              <Text style={[
                styles.marketDropdownItemText,
                marketFilter === 'Perp+Spot' && styles.marketDropdownItemTextActive
              ]}>Perp+Spot</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.marketDropdownItem}
              onPress={() => handleMarketFilterChange('All Markets')}
            >
              <Text style={[
                styles.marketDropdownItemText,
                marketFilter === 'All Markets' && styles.marketDropdownItemTextActive
              ]}>All Markets</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Modals */}
      <DepositModal 
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
      />
      <WithdrawModal 
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
      />
      <PerpSpotTransferModal 
        visible={perpSpotTransferVisible}
        onClose={() => setPerpSpotTransferVisible(false)}
        perpBalance={account.data?.perpMarginSummary?.withdrawable 
          ? parseFloat(account.data.perpMarginSummary.withdrawable) 
          : 0}
        spotBalance={(() => {
          const usdcBalance = account.data?.spotBalances.find(b => b.coin === 'USDC');
          return usdcBalance ? parseFloat(usdcBalance.total) : 0;
        })()}
      />
      <TransferToStakingModal 
        visible={transferToStakingVisible}
        onClose={() => setTransferToStakingVisible(false)}
        maxAmount={(() => {
          const hypeBalance = account.data?.spotBalances.find(b => b.coin === 'HYPE');
          return hypeBalance ? parseFloat(hypeBalance.total) : 0;
        })()}
      />
      <TransferFromStakingModal 
        visible={transferFromStakingVisible}
        onClose={() => setTransferFromStakingVisible(false)}
        maxAmount={account.data?.stakingSummary 
          ? parseFloat(account.data.stakingSummary.undelegated || '0')
          : 0}
      />
      <DelegateModal 
        visible={delegateModalVisible}
        onClose={() => setDelegateModalVisible(false)}
        maxAmount={account.data?.stakingSummary 
          ? parseFloat(account.data.stakingSummary.undelegated || '0')
          : 0}
      />
      {selectedDelegation && (
        <UndelegateModal 
          visible={undelegateModalVisible}
          onClose={() => {
            setUndelegateModalVisible(false);
            setSelectedDelegation(null);
          }}
          validator={selectedDelegation.validator}
          maxAmount={parseFloat(selectedDelegation.amount)}
        />
      )}
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

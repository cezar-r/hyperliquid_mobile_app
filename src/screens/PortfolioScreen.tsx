import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, Animated } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
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

type MarketFilter = 'Perp' | 'Spot' | 'Staking' | 'Perp+Spot' | 'All';
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
  const { account } = useWallet();
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

  // Filter states
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [tradesDisplayLimit, setTradesDisplayLimit] = useState(10);
  const [marketDropdownVisible, setMarketDropdownVisible] = useState(false);
  
  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedMarketFilter = await AsyncStorage.getItem(PORTFOLIO_MARKET_FILTER_KEY);
        if (savedMarketFilter && ['Perp', 'Spot', 'Perp+Spot', 'Staking', 'All'].includes(savedMarketFilter)) {
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
    // 'All' shows all fills
    
    return fills;
  }, [account.data?.userFills, timeFilter, marketFilter, wsState.perpMarkets, wsState.spotMarkets]);

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

  // Check what to show based on market filter
  const showPerps = ['Perp', 'Perp+Spot', 'All'].includes(marketFilter);
  const showSpot = ['Spot', 'Perp+Spot', 'All'].includes(marketFilter);
  const showStaking = ['Staking', 'All'].includes(marketFilter);
  const showEquityBreakdown = ['Perp+Spot', 'All', 'Staking'].includes(marketFilter);

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
            
            {marketDropdownVisible && (
              <View style={styles.marketDropdownMenu}>
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
                  onPress={() => handleMarketFilterChange('All')}
                >
                  <Text style={[
                    styles.marketDropdownItemText,
                    marketFilter === 'All' && styles.marketDropdownItemTextActive
                  ]}>All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
                    <Text style={styles.portfolioValue}>${formatNumber(totalValue, 2)}</Text>
                    {showPnL && totalPnL !== 0 && (
                      <Text style={[
                        styles.portfolioPnL,
                        totalPnL >= 0 ? styles.pnlPositive : styles.pnlNegative
                      ]}>
                        {totalPnL >= 0 ? '+' : ''}${formatNumber(totalPnL, 2)}
                      </Text>
                    )}
                    
                    {/* Equity Breakdown */}
                    {showEquityBreakdown && (
                      <View style={styles.equityBreakdownContainer}>
                        {(showPerps || marketFilter === 'All') && perpAccountValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Perp</Text>
                            <Text style={styles.equityValue}>${formatNumber(perpAccountValue, 2)}</Text>
                          </View>
                        )}
                        {(showSpot || marketFilter === 'All') && spotTotalValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Spot</Text>
                            <Text style={styles.equityValue}>${formatNumber(spotTotalValue, 2)}</Text>
                          </View>
                        )}
                        {(showStaking && (marketFilter === 'All' || marketFilter !== 'Staking')) && stakingValue > 0 && (
                          <View style={styles.equityRow}>
                            <Text style={styles.equityLabel}>Staking</Text>
                            <Text style={styles.equityValue}>${formatNumber(stakingValue, 2)}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Account Details */}
                  {(showPerps || showSpot || marketFilter === 'Perp+Spot' || marketFilter === 'All') && (
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
                      <Text style={styles.sectionLabel}>
                        Open Positions ({sortedPerpPositions.length})
                      </Text>
                      {sortedPerpPositions.map((item, idx) => {
                        const positionSize = parseFloat(item.position.szi);
                        const isLong = positionSize > 0;
                        const leverage = item.position.leverage?.value || 1;
                        const price = item.price ? parseFloat(item.price) : 0;
                        
                        // Calculate 24h change
                        const prevDayPx = item.assetContext?.prevDayPx || price;
                        const priceChange = price - prevDayPx;
                        const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                        
                        return (
                          <TouchableOpacity
                            key={`perp-${item.position.coin}`}
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
                        );
                      })}
                    </View>
                  )}

                  {/* Spot Balances */}
                  {showSpot && sortedSpotBalances.length > 0 && (
                    <View style={styles.positionsContainer}>
                      <Text style={styles.sectionLabel}>
                        Spot Balances ({sortedSpotBalances.length})
                      </Text>
                      {sortedSpotBalances.map((item) => {
                        const price = item.price ? parseFloat(item.price) : 0;
                        
                        // Calculate 24h change
                        const prevDayPx = item.assetContext?.prevDayPx || price;
                        const priceChange = price - prevDayPx;
                        const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                        
                        return (
                          <TouchableOpacity
                            key={`spot-${item.balance.coin}`}
                            style={styles.positionCell}
                            onPress={() => handleNavigateToChart(item.balance.coin, 'spot')}
                          >
                            <View style={styles.leftSide}>
                              <View style={styles.tickerContainer}>
                                <Text style={styles.ticker}>{item.balance.coin}</Text>
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
                                {formatNumber(item.total, 4)} {item.balance.coin}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Staking Section */}
                  {showStaking && (
                    <View style={styles.stakingSection}>
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
                            style={styles.stakingButton}
                            onPress={() => setTransferToStakingVisible(true)}
                            disabled={!account.data.spotBalances.find(b => b.coin === 'HYPE') || 
                                      parseFloat(account.data.spotBalances.find(b => b.coin === 'HYPE')?.total || '0') <= 0}
                          >
                            <Text style={styles.stakingButtonText}>Transfer to Staking</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.stakingButton}
                            onPress={() => setTransferFromStakingVisible(true)}
                            disabled={!account.data.stakingSummary || 
                                      parseFloat(account.data.stakingSummary.undelegated || '0') <= 0}
                          >
                            <Text style={styles.stakingButtonText}>Transfer to Spot</Text>
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

                  {/* Open Orders */}
                  {account.data.openOrders.length > 0 && (
                    <View style={styles.openOrdersContainer}>
                      <Text style={styles.sectionTitle}>
                        Open Orders ({account.data.openOrders.length})
                      </Text>
                      {account.data.openOrders.slice(0, 10).map((order: any, idx: number) => (
                        <View key={`order-${idx}`} style={styles.orderCard}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderCoin}>{order.coin}</Text>
                            <Text style={[
                              styles.orderSide,
                              order.side === 'B' ? styles.sideBuy : styles.sideSell
                            ]}>
                              {order.side === 'B' ? 'BUY' : 'SELL'}
                            </Text>
                          </View>
                          <View style={styles.orderDetail}>
                            <Text style={styles.orderLabel}>Price:</Text>
                            <Text style={styles.orderValue}>${order.limitPx}</Text>
                          </View>
                          <View style={styles.orderDetail}>
                            <Text style={styles.orderLabel}>Size:</Text>
                            <Text style={styles.orderValue}>{order.sz}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recent Trades */}
                  {filteredFills.length > 0 && (
                    <View style={styles.recentTradesContainer}>
                      <Text style={styles.sectionTitle}>
                        Recent Trades ({filteredFills.length})
                      </Text>
                      {filteredFills.slice(0, tradesDisplayLimit).map((fill: UserFill, idx: number) => (
                        <View key={`fill-${idx}`} style={styles.tradeCard}>
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
                  )}
                </>
              )}
            </>
          )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
      
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
    </SafeAreaView>
  );
}

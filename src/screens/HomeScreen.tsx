import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Animated, SafeAreaView } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice, formatSize } from '../lib/formatting';
import { styles } from './styles/HomeScreen.styles';
import type { PerpPosition, SpotBalance } from '../types';
import Color from '../styles/colors';

type MarketFilter = 'Perp' | 'Spot' | 'Perp+Spot';

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
function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

// Helper to format percentage
function formatPercent(num: number, decimals: number = 2): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${(num * 100).toFixed(decimals)}%`;
}

export default function HomeScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const navigation = useNavigation<any>();
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Perp+Spot');
  
  // For balance animation
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);

  // Load saved market filter on mount
  useEffect(() => {
    const loadMarketFilter = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(MARKET_FILTER_KEY);
        if (savedFilter && (savedFilter === 'Perp' || savedFilter === 'Spot' || savedFilter === 'Perp+Spot')) {
          setMarketFilter(savedFilter as MarketFilter);
        }
      } catch (error) {
        console.error('[HomeScreen] Error loading market filter:', error);
      }
    };
    loadMarketFilter();
  }, []);

  // Save market filter when it changes
  const handleFilterChange = async (filter: MarketFilter) => {
    setMarketFilter(filter);
    try {
      await AsyncStorage.setItem(MARKET_FILTER_KEY, filter);
    } catch (error) {
      console.error('[HomeScreen] Error saving market filter:', error);
    }
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
      const price = wsState.prices[balance.coin];
      if (price) {
        spotValue += total * parseFloat(price);
      }
    });
    return spotValue;
  }, [account.data?.spotBalances, wsState.prices]);

  // Calculate displayed balance based on filter
  const displayedBalance = useMemo(() => {
    if (marketFilter === 'Perp') return perpAccountValue;
    if (marketFilter === 'Spot') return spotTotalValue;
    return perpAccountValue + spotTotalValue;
  }, [marketFilter, perpAccountValue, spotTotalValue]);

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
        const price = wsState.prices[balance.coin];
        const total = parseFloat(balance.total);
        const usdValue = price ? total * parseFloat(price) : 0;
        
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

  // Navigate to chart detail - Set coin/market first, then navigate (like SearchScreen does)
  const handleNavigateToChart = (coin: string, market: 'perp' | 'spot') => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView}>
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

        {/* Large Balance Display */}
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
            {/* Perp Positions */}
            {(marketFilter === 'Perp' || marketFilter === 'Perp+Spot') && sortedPerpPositions.length > 0 && (
              <View>
                {marketFilter === 'Perp+Spot' && (
                  <Text style={styles.sectionLabel}>Perps</Text>
                )}
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
            {(marketFilter === 'Spot' || marketFilter === 'Perp+Spot') && sortedSpotBalances.length > 0 && (
              <View style={marketFilter === 'Perp+Spot' ? styles.spotSection : undefined}>
                {marketFilter === 'Perp+Spot' && (
                  <Text style={styles.sectionLabel}>Balances</Text>
                )}
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
      </View>
    </SafeAreaView>
  );
}


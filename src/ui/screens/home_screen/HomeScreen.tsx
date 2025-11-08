import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, ScrollView, Alert, Animated, SafeAreaView, InteractionManager } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { formatPrice, formatSize } from '../../../lib/formatting';
import { getStarredTickers } from '../../../lib/starredTickers';
import { playNavToChartHaptic } from '../../../lib/haptics';
import { styles } from './styles/HomeScreen.styles';
import type { PerpPosition } from '../../../types';
import { Color } from '../../shared/styles';
import { DepositModal } from '../../modals';
import { PanelSelector, EmptyState, ErrorState, SkeletonScreen } from '../../shared/components';
import {
  BalanceContent,
  PerpPositionsContainer,
  SpotBalancesContainer,
  StakingContainer,
  StarredTickersContainer,
  LoadingState,
} from './components';

type MarketFilter = 'Perp' | 'Spot' | 'Account';

const MARKET_FILTER_KEY = 'hl_home_market_filter';

// Helper to calculate PnL for a position
function calculatePositionPnL(
  position: PerpPosition,
  currentPrice: string | number
): { pnl: number; pnlPercent: number } {
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

export default function HomeScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const navigation = useNavigation<any>();
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Account');
  const [depositModalVisible, setDepositModalVisible] = useState(false);

  // For skeleton loading
  const [isReady, setIsReady] = useState(false);

  // For starred tickers
  const [starredPerpTickers, setStarredPerpTickers] = useState<string[]>([]);
  const [starredSpotTickers, setStarredSpotTickers] = useState<string[]>([]);

  // For balance animation
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);

  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Defer rendering until navigation is complete
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

  // Load saved market filter on mount
  useEffect(() => {
    const loadMarketFilter = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(MARKET_FILTER_KEY);
        if (
          savedFilter &&
          (savedFilter === 'Perp' || savedFilter === 'Spot' || savedFilter === 'Account')
        ) {
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
  const handleFilterChange = async (
    filter: MarketFilter,
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
    account.data.spotBalances.forEach((balance) => {
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

    const totalStaked =
      parseFloat(account.data.stakingSummary.delegated || '0') +
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
    const previousRounded =
      previousBalance !== null ? Math.round(previousBalance * 100) / 100 : null;

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
        }),
      ]).start();
      setPreviousBalance(currentRounded);
    }
  }, [displayedBalance, colorAnim]);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Color.FG_1, isIncrease ? Color.BRIGHT_ACCENT : Color.RED],
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
      .map((position) => {
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
      .filter((balance) => parseFloat(balance.total) > 0)
      .map((balance) => {
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
    if (
      (marketFilter === 'Perp' || marketFilter === 'Account') &&
      starredPerpTickers.length > 0
    ) {
      starredPerpTickers.forEach((ticker) => {
        const ctx = wsState.assetContexts[ticker];
        const price = ctx?.markPx || 0;
        const prevPrice = ctx?.prevDayPx || price;
        const priceChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
        const volume = ctx?.dayNtlVlm || 0;
        const market = wsState.perpMarkets.find((m) => m.name === ticker);
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
    if (
      (marketFilter === 'Spot' || marketFilter === 'Account') &&
      starredSpotTickers.length > 0
    ) {
      starredSpotTickers.forEach((ticker) => {
        const ctx = wsState.assetContexts[ticker];
        const price = parseFloat(wsState.prices[ticker] || '0');
        const prevPrice = ctx?.prevDayPx || price;
        const priceChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
        const volume = ctx?.dayNtlVlm || 0;
        
        // For spot tickers, use the actual market name
        const displayName = ticker;

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

    const market = wsState.perpMarkets.find((m) => m.name === coin);
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
        `Execution Price: $${executionPrice.toFixed(2)} (${
          size > 0 ? '-0.1%' : '+0.1%'
        } slippage)\n\n` +
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
                orders: [
                  {
                    a: assetIndex,
                    b: size < 0,
                    p: formattedPrice,
                    s: formattedSize,
                    r: true,
                    t: {
                      limit: { tif: 'Ioc' as const },
                    },
                  },
                ],
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
      `Close ALL ${sortedPerpPositions.length} perp position${
        sortedPerpPositions.length !== 1 ? 's' : ''
      }?\n\nThis will close all your open perpetual positions.`,
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
                const market = wsState.perpMarkets.find((m) => m.name === coin);

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
                    orders: [
                      {
                        a: assetIndex,
                        b: size < 0,
                        p: formattedPrice,
                        s: formattedSize,
                        r: true,
                        t: {
                          limit: { tif: 'Ioc' as const },
                        },
                      },
                    ],
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

              console.log(
                '[HomeScreen] Closed positions:',
                successCount,
                'succeeded,',
                failCount,
                'failed'
              );

              if (successCount > 0) {
                Alert.alert(
                  'Positions Closed',
                  `Successfully closed ${successCount} position${successCount !== 1 ? 's' : ''}${
                    failCount > 0 ? `\n${failCount} failed` : ''
                  }`
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

  if (!isReady) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Market Filter Panel */}
        <PanelSelector
          options={['Perp', 'Spot', 'Account']}
          selectedOption={marketFilter}
          onOptionChange={(option) => handleFilterChange(option as MarketFilter)}
        />

        {/* Entire page wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView}>
              <BalanceContent
                balance={displayedBalance}
                showDepositButton={marketFilter === 'Account' && displayedBalance === 0}
                onDepositPress={() => setDepositModalVisible(true)}
                textColor={textColor}
              />

              {account.isLoading && <LoadingState />}

              {account.error && <ErrorState error={account.error} />}

              {!account.isLoading && !account.error && account.data && (
                <View style={styles.positionsContainer}>
                  {/* Perp Positions + USDC Withdrawable */}
                  {(marketFilter === 'Perp' || marketFilter === 'Account') && (
                    <PerpPositionsContainer
                      sortedPositions={sortedPerpPositions}
                      withdrawableUsdc={withdrawableUsdc}
                      onNavigateToChart={handleNavigateToChart}
                      showCloseAll={marketFilter === 'Account'}
                      onCloseAll={handleCloseAll}
                    />
                  )}

                  {/* Spot Balances */}
                  {(marketFilter === 'Spot' || marketFilter === 'Account') && (
                    <SpotBalancesContainer
                      sortedBalances={sortedSpotBalances}
                      spotMarkets={wsState.spotMarkets}
                      onNavigateToChart={handleNavigateToChart}
                      showLabel={marketFilter === 'Account'}
                    />
                  )}

                  {/* Staking Balance */}
                  {marketFilter === 'Account' && account.data?.stakingDelegations && (
                    <StakingContainer
                      delegations={account.data.stakingDelegations}
                      hypePrice={
                        wsState.prices['HYPE'] ? parseFloat(wsState.prices['HYPE']) : 0
                      }
                    />
                  )}

                  {/* Starred Tickers Section */}
                  <StarredTickersContainer
                    perpData={starredTickersData.perpData}
                    spotData={starredTickersData.spotData}
                    marketFilter={marketFilter}
                    onNavigateToChart={handleNavigateToChart}
                  />

                  {/* Empty State */}
                  {sortedPerpPositions.length === 0 && sortedSpotBalances.length === 0 && (
                    <EmptyState
                      message="No positions or balances"
                      submessage="Your positions and balances will appear here"
                    />
                  )}
                </View>
              )}

              {!account.isLoading && !account.error && !account.data && address && (
                <EmptyState
                  message="No account data available yet."
                  submessage="Data will appear after connecting your wallet."
                />
              )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Deposit Modal */}
      <DepositModal visible={depositModalVisible} onClose={() => setDepositModalVisible(false)} />
    </SafeAreaView>
  );
}


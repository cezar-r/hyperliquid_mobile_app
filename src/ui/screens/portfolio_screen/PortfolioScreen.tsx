import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  InteractionManager,
} from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import {
  formatPrice as formatPriceForOrder,
  formatSize as formatSizeForOrder,
  resolveSpotTicker,
} from '../../../lib/formatting';
import { playNavToChartHaptic } from '../../../lib/haptics';
import { styles } from './styles/PortfolioScreen.styles';
import type { PerpPosition, UserFill } from '../../../types';
import { Color } from '../../shared/styles';
import DepositModal from '../../../components/DepositModal';
import WithdrawModal from '../../../components/WithdrawModal';
import PerpSpotTransferModal from '../../../components/PerpSpotTransferModal';
import TransferToStakingModal from '../../../components/TransferToStakingModal';
import TransferFromStakingModal from '../../../components/TransferFromStakingModal';
import DelegateModal from '../../../components/DelegateModal';
import UndelegateModal from '../../../components/UndelegateModal';
import TPSLEditModal from '../../../components/TPSLEditModal';
import SkeletonScreen from '../../../components/SkeletonScreen';
import { EmptyState } from '../../shared/components';
import {
  TimeFilterSelector,
  MarketDropdown,
  BalanceContainer,
  FundsActionsContainer,
  EquityBreakdown,
  PortfolioOpenOrdersContainer,
  PortfolioStakingContainer,
  RecentTradesContainer,
} from './components';
import type { TimeFilter, MarketFilter } from './components';
import { PerpPositionsContainer, SpotBalancesContainer } from '../home_screen/components';

const PORTFOLIO_MARKET_FILTER_KEY = 'hl_portfolio_market_filter';
const PORTFOLIO_TIME_FILTER_KEY = 'hl_portfolio_time_filter';

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

  // For skeleton loading
  const [isReady, setIsReady] = useState(false);

  // Modal states
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [perpSpotTransferVisible, setPerpSpotTransferVisible] = useState(false);
  const [transferToStakingVisible, setTransferToStakingVisible] = useState(false);
  const [transferFromStakingVisible, setTransferFromStakingVisible] = useState(false);
  const [delegateModalVisible, setDelegateModalVisible] = useState(false);
  const [undelegateModalVisible, setUndelegateModalVisible] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<{
    validator: `0x${string}`;
    amount: string;
  } | null>(null);
  const [editingTPSL, setEditingTPSL] = useState<PerpPosition | null>(null);

  // Filter states
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Account');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [tradesDisplayLimit, setTradesDisplayLimit] = useState(10);
  const [marketDropdownVisible, setMarketDropdownVisible] = useState(false);

  // For value animation
  const [previousValue, setPreviousValue] = useState<number | null>(null);
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

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedMarketFilter = await AsyncStorage.getItem(PORTFOLIO_MARKET_FILTER_KEY);
        if (
          savedMarketFilter &&
          ['Perp', 'Spot', 'Perp+Spot', 'Staking', 'Account'].includes(savedMarketFilter)
        ) {
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
  const handleTimeFilterChange = async (
    filter: TimeFilter,
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
    const perpCoins = new Set(wsState.perpMarkets.map((m) => m.name));
    const spotCoins = new Set(wsState.spotMarkets.map((m) => m.name.split('/')[0]));

    let fills = account.data.userFills;

    // Filter by time
    if (cutoff !== null) {
      fills = fills.filter((fill) => fill.time >= cutoff);
    }

    // Filter by market type
    if (marketFilter === 'Perp') {
      fills = fills.filter((fill) => perpCoins.has(fill.coin));
    } else if (marketFilter === 'Spot') {
      fills = fills.filter((fill) => spotCoins.has(fill.coin));
    } else if (marketFilter === 'Perp+Spot') {
      fills = fills.filter((fill) => perpCoins.has(fill.coin) || spotCoins.has(fill.coin));
    } else if (marketFilter === 'Staking') {
      fills = []; // No fills for staking
    }
    // 'Account' shows all fills

    return fills;
  }, [account.data?.userFills, timeFilter, marketFilter, wsState.perpMarkets, wsState.spotMarkets]);

  // Helper to check if a fill is a spot trade (handles both base token name and API format)
  const isSpotFill = useCallback(
    (coin: string) => {
      // Check if coin is in API format (@{index})
      if (coin.startsWith('@')) {
        return wsState.spotMarkets.some((m) => m.apiName === coin);
      }
      // Otherwise check against base token names
      return wsState.spotMarkets.some((m) => m.name.split('/')[0] === coin);
    },
    [wsState.spotMarkets]
  );

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

  // Calculate total portfolio value and PnL based on market filter
  const { totalValue, unrealizedPnL, realizedPnL, totalPnL, showPnL } = useMemo(() => {
    if (!account.data)
      return { totalValue: 0, unrealizedPnL: 0, realizedPnL: 0, totalPnL: 0, showPnL: false };

    let value = 0;
    let uPnl = 0;
    let shouldShowPnL = false;

    // Calculate value and PnL based on market filter
    if (marketFilter === 'Perp') {
      value = perpAccountValue;
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach((position) => {
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
      account.data.perpPositions.forEach((position) => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          uPnl += posPnl;
        }
      });
    } else {
      // Account
      value = perpAccountValue + spotTotalValue + stakingValue;
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach((position) => {
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
      showPnL: shouldShowPnL,
    };
  }, [
    account.data,
    wsState.prices,
    perpAccountValue,
    spotTotalValue,
    stakingValue,
    filteredFills,
    marketFilter,
  ]);

  // Animate value changes - only when there's an actual change at 2 decimal places
  useEffect(() => {
    // Round to 2 decimals for comparison
    const currentRounded = Math.round(totalValue * 100) / 100;
    const previousRounded =
      previousValue !== null ? Math.round(previousValue * 100) / 100 : null;

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
        }),
      ]).start();
      setPreviousValue(currentRounded);
    }
  }, [totalValue, colorAnim]);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Color.FG_1, isIncrease ? Color.BRIGHT_ACCENT : Color.RED],
  });

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

  // Navigate to chart detail
  const handleNavigateToChart = (coin: string, market: 'perp' | 'spot') => {
    // Play haptic feedback
    playNavToChartHaptic();

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

    // Get filtered orders
    const getOrderMarketType = (coin: string): 'perp' | 'spot' | null => {
      const perpMarket = wsState.perpMarkets.find((m) => m.name === coin);
      if (perpMarket) return 'perp';

      const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
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
      } else if (marketFilter === 'Account') {
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
      `Cancel ALL ${filteredOrders.length} open order${
        filteredOrders.length !== 1 ? 's' : ''
      }?\n\nThis will cancel all your visible open limit orders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // Build cancels array with asset index and order ID for each order
              const cancels = filteredOrders.map((order: any) => {
                const perpMarket = wsState.perpMarkets.find((m) => m.name === order.coin);
                const spotMarket = wsState.spotMarkets.find(
                  (m) => m.name === order.coin || m.apiName === order.coin
                );

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

              Alert.alert(
                'Success',
                `${filteredOrders.length} order${
                  filteredOrders.length !== 1 ? 's' : ''
                } canceled successfully!`
              );

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
                  const formattedSize = formatSizeForOrder(
                    Math.abs(size),
                    szDecimals,
                    currentPrice
                  );

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

                  console.log(`[PortfolioScreen] Closing position ${coin}...`);
                  await exchangeClient.order(orderPayload);
                  successCount++;
                } catch (err: any) {
                  console.error(`[PortfolioScreen] Failed to close ${coin}:`, err.message);
                  failCount++;
                }
              }

              console.log(
                '[PortfolioScreen] Closed positions:',
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
              console.error('[PortfolioScreen] Failed to close all positions:', err);
              Alert.alert('Error', `Failed to close positions: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  // Handle cancel single order
  const handleCancelOrder = async (order: any, orderMarketType: 'perp' | 'spot' | null) => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    // Get market info
    const perpMarket = wsState.perpMarkets.find((m) => m.name === order.coin);
    const spotMarket = wsState.spotMarkets.find(
      (m) => m.name === order.coin || m.apiName === order.coin
    );

    const getDisplayName = (coin: string) => {
      const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
      if (spotMarket) return spotMarket.name;
      return coin;
    };

    const displayName = getDisplayName(order.coin);

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
  };

  // Helper functions for orders container
  const getDisplayName = (coin: string) => {
    const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
    if (spotMarket) return spotMarket.name;
    return coin;
  };

  const getOrderMarketType = (coin: string): 'perp' | 'spot' | null => {
    const perpMarket = wsState.perpMarkets.find((m) => m.name === coin);
    if (perpMarket) return 'perp';

    const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
    if (spotMarket) return 'spot';

    return null;
  };

  // Filter orders by market type
  const filteredOrders = useMemo(() => {
    if (!account.data?.openOrders) return [];

    return account.data.openOrders.filter((order: any) => {
      const orderMarketType = getOrderMarketType(order.coin);

      if (marketFilter === 'Perp') {
        return orderMarketType === 'perp';
      } else if (marketFilter === 'Spot') {
        return orderMarketType === 'spot';
      } else if (marketFilter === 'Perp+Spot') {
        return orderMarketType === 'perp' || orderMarketType === 'spot';
      } else if (marketFilter === 'Account') {
        return orderMarketType === 'perp' || orderMarketType === 'spot';
      } else if (marketFilter === 'Staking') {
        return false;
      }
      return false;
    });
  }, [account.data?.openOrders, marketFilter]);

  // Helper to get display coin for trades
  const getDisplayCoin = useCallback(
    (coin: string) => {
      return isSpotFill(coin) ? resolveSpotTicker(coin, wsState.spotMarkets) : coin;
    },
    [isSpotFill, wsState.spotMarkets]
  );

  // Check what to show based on market filter
  const showPerps = ['Perp', 'Perp+Spot', 'Account'].includes(marketFilter);
  const showSpot = ['Spot', 'Perp+Spot', 'Account'].includes(marketFilter);
  const showStaking = ['Staking', 'Account'].includes(marketFilter);
  const showEquityBreakdown = ['Perp+Spot', 'Account', 'Staking'].includes(marketFilter);

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

  if (!isReady) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Time Period Filter */}
        <TimeFilterSelector selectedFilter={timeFilter} onFilterChange={handleTimeFilterChange} />

        {/* Entire content wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
              {/* Market Filter Dropdown */}
              <MarketDropdown
                selectedFilter={marketFilter}
                isVisible={marketDropdownVisible}
                onToggle={() => setMarketDropdownVisible(!marketDropdownVisible)}
                onFilterChange={handleMarketFilterChange}
              />

              {!address && (
                <EmptyState
                  message="No wallet connected"
                  submessage="Connect your wallet to view portfolio"
                />
              )}

              {address && (
                <>
                  {account.isLoading && (
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 40,
                        marginTop: 40,
                      }}
                    >
                      <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
                    </View>
                  )}

                  {account.error && (
                    <View
                      style={{
                        backgroundColor: '#1a1f26',
                        padding: 16,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: Color.RED,
                        marginHorizontal: 16,
                        marginTop: 16,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: Color.RED }}>⚠️ {account.error}</Text>
                    </View>
                  )}

                  {!account.isLoading && !account.error && account.data && (
                    <>
                      {/* Balance Container */}
                      <BalanceContainer
                        totalValue={totalValue}
                        totalPnL={totalPnL}
                        showPnL={showPnL}
                        timeFilter={timeFilter}
                        tradingVolume={tradingVolume}
                        marketFilter={marketFilter}
                        textColor={textColor}
                      />

                      {/* Unified layout for all non-staking markets */}
                      {marketFilter !== 'Staking' && (
                        <>
                          {/* Action Buttons (Deposit/Withdraw/Transfer) */}
                          <FundsActionsContainer
                            onDepositPress={() => setDepositModalVisible(true)}
                            onWithdrawPress={() => setWithdrawModalVisible(true)}
                            onTransferPress={() => setPerpSpotTransferVisible(true)}
                          />

                          <View style={styles.separator} />

                          {/* Equity Breakdown */}
                          {showEquityBreakdown && (
                            <EquityBreakdown
                              perpAccountValue={perpAccountValue}
                              spotTotalValue={spotTotalValue}
                              stakingValue={stakingValue}
                              withdrawable={account.data.perpMarginSummary.withdrawable || ''}
                              marketFilter={marketFilter}
                              showPerps={showPerps}
                              showSpot={showSpot}
                              showStaking={showStaking}
                            />
                          )}

                          <View style={styles.separator} />

                          {/* Perp Positions */}
                          {showPerps && sortedPerpPositions.length > 0 && (
                            <PerpPositionsContainer
                              sortedPositions={sortedPerpPositions}
                              withdrawableUsdc={0}
                              onNavigateToChart={handleNavigateToChart}
                              showCloseAll={true}
                              onCloseAll={handleCloseAllPositions}
                            />
                          )}

                          {/* Spot Balances */}
                          {showSpot && sortedSpotBalances.length > 0 && (
                            <SpotBalancesContainer
                              sortedBalances={sortedSpotBalances}
                              spotMarkets={wsState.spotMarkets}
                              onNavigateToChart={handleNavigateToChart}
                              showLabel={marketFilter === 'Account' || marketFilter === 'Perp+Spot'}
                            />
                          )}
                        </>
                      )}

                      {/* Open Orders - Filtered by market type */}
                      <PortfolioOpenOrdersContainer
                        orders={filteredOrders}
                        getDisplayName={getDisplayName}
                        getOrderMarketType={getOrderMarketType}
                        onCancelAll={handleCancelAll}
                        onCancelOrder={handleCancelOrder}
                      />

                      {/* Staking Section */}
                      {showStaking && (
                        <PortfolioStakingContainer
                          stakingSummary={account.data.stakingSummary}
                          spotHypeBalance={
                            account.data.spotBalances.find((b) => b.coin === 'HYPE')
                              ? parseFloat(
                                  account.data.spotBalances.find((b) => b.coin === 'HYPE')!.total
                                )
                              : 0
                          }
                          stakingDelegations={account.data.stakingDelegations}
                          marketFilter={marketFilter}
                          onTransferToStakingPress={() => setTransferToStakingVisible(true)}
                          onTransferToSpotPress={() => setTransferFromStakingVisible(true)}
                          onDelegatePress={() => setDelegateModalVisible(true)}
                          onUndelegatePress={(delegation) => {
                            setSelectedDelegation(delegation);
                            setUndelegateModalVisible(true);
                          }}
                        />
                      )}

                      {/* Separator */}
                      <View style={styles.separator} />

                      {/* Recent Trades */}
                      {filteredFills.length > 0 && marketFilter !== 'Staking' && (
                        <RecentTradesContainer
                          trades={filteredFills}
                          displayLimit={tradesDisplayLimit}
                          onShowMore={() => {
                            if (tradesDisplayLimit === 10) {
                              setTradesDisplayLimit(20);
                            } else if (tradesDisplayLimit === 20) {
                              setTradesDisplayLimit(50);
                            } else if (tradesDisplayLimit === 50) {
                              setTradesDisplayLimit(filteredFills.length);
                            }
                          }}
                          getDisplayCoin={getDisplayCoin}
                        />
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
      <DepositModal visible={depositModalVisible} onClose={() => setDepositModalVisible(false)} />
      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
      />
      <PerpSpotTransferModal
        visible={perpSpotTransferVisible}
        onClose={() => setPerpSpotTransferVisible(false)}
        perpBalance={
          account.data?.perpMarginSummary?.withdrawable
            ? parseFloat(account.data.perpMarginSummary.withdrawable)
            : 0
        }
        spotBalance={(() => {
          const usdcBalance = account.data?.spotBalances.find((b) => b.coin === 'USDC');
          return usdcBalance ? parseFloat(usdcBalance.total) : 0;
        })()}
      />
      <TransferToStakingModal
        visible={transferToStakingVisible}
        onClose={() => setTransferToStakingVisible(false)}
        maxAmount={(() => {
          const hypeBalance = account.data?.spotBalances.find((b) => b.coin === 'HYPE');
          return hypeBalance ? parseFloat(hypeBalance.total) : 0;
        })()}
      />
      <TransferFromStakingModal
        visible={transferFromStakingVisible}
        onClose={() => setTransferFromStakingVisible(false)}
        maxAmount={
          account.data?.stakingSummary
            ? parseFloat(account.data.stakingSummary.undelegated || '0')
            : 0
        }
      />
      <DelegateModal
        visible={delegateModalVisible}
        onClose={() => setDelegateModalVisible(false)}
        maxAmount={
          account.data?.stakingSummary
            ? parseFloat(account.data.stakingSummary.undelegated || '0')
            : 0
        }
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


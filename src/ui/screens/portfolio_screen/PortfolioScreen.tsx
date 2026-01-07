import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
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
import { resolveSubscriptionCoin, getPositionContextKey, getAssetIdForMarket } from '../../../lib/markets';
import { playNavToChartHaptic } from '../../../lib/haptics';
import {
  logScreenMount,
  logScreenUnmount,
  logScreenFocus,
  logScreenBlur,
  logRender,
  logUserAction,
  logScreenFullyRendered,
} from '../../../lib/logger';
import { styles } from './styles/PortfolioScreen.styles';
import type { PerpPosition, UserFill } from '../../../types';
import { Color } from '../../shared/styles';
import { DepositModal, WithdrawModal, PerpSpotTransferModal, DelegateModal, UndelegateModal, TransferToStakingModal, TransferFromStakingModal, TPSLEditModal } from '../../modals';
import { EmptyState, LoadingBlob, SkeletonScreen, RecentTradesContainer } from '../../shared/components';
import {
  TimeFilterSelector,
  MarketDropdown,
  BalanceContainer,
  FundsActionsContainer,
  EquityBreakdown,
  PortfolioOpenOrdersContainer,
  PortfolioStakingContainer,
} from './components';
import type { TimeFilter, MarketFilter } from './components';
import { PerpPositionsContainer, SpotBalancesContainer } from '../home_screen/components';

const PORTFOLIO_MARKET_FILTER_KEY = 'hl_portfolio_market_filter';
const PORTFOLIO_TIME_FILTER_KEY = 'hl_portfolio_time_filter';
const HIDE_SMALL_BALANCES_KEY = '@hide_small_balances';

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
  const { account, exchangeClient, refetchAccount, getExchangeClientForDex } = useWallet();
  const { state: wsState, selectCoin, setMarketType, infoClient } = useWebSocket();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // For skeleton loading
  const [isReady] = useState(true);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('PortfolioScreen');
    return () => {
      logScreenUnmount('PortfolioScreen');
    };
  }, []);

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
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [recentTradesSnapshot, setRecentTradesSnapshot] = useState<UserFill[]>([]);

  // State for historical spot prices (for time-based PnL) - keyed by timeFilter
  const [historicalSpotPrices, setHistoricalSpotPrices] = useState<{
    '24h': Record<string, number>;
    '7d': Record<string, number>;
    '30d': Record<string, number>;
  }>({
    '24h': {},
    '7d': {},
    '30d': {},
  });

  const [isFetchingHistorical, setIsFetchingHistorical] = useState(false);

  // Track which time filters have been loaded at least once (for loading indicator)
  const hasLoadedOnceRef = useRef<Set<'24h' | '7d' | '30d'>>(new Set());

  // Track last fetch time for EACH time filter independently (to throttle fetching to once per minute per filter)
  const lastFetchTimeRef = useRef<{
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
  }>({});

  // Close dropdown when navigating away from screen
  useFocusEffect(
    React.useCallback(() => {
      logScreenFocus('PortfolioScreen');
      return () => {
        logScreenBlur('PortfolioScreen');
        // Close dropdown when screen loses focus
        if (marketDropdownVisible) {
          setMarketDropdownVisible(false);
        }
      };
    }, [marketDropdownVisible])
  );

  // Log rendering
  useEffect(() => {
    if (account.data) {
      logRender('PortfolioScreen', `filter: ${marketFilter}, time: ${timeFilter}`);
      logScreenFullyRendered('PortfolioScreen');
    }
  }, [account.data, marketFilter, timeFilter]);

  // For value animation
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);

  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Defer rendering was removed to avoid initial flicker on first tab visit

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

        const hideSmallBalancesValue = await AsyncStorage.getItem(HIDE_SMALL_BALANCES_KEY);
        if (hideSmallBalancesValue !== null) {
          setHideSmallBalances(hideSmallBalancesValue === 'true');
        }
      } catch (error) {
        console.error('[PortfolioScreen] Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Reload hide small balances preference when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadHideSmallBalances = async () => {
        try {
          const hideSmallBalancesValue = await AsyncStorage.getItem(HIDE_SMALL_BALANCES_KEY);
          if (hideSmallBalancesValue !== null) {
            setHideSmallBalances(hideSmallBalancesValue === 'true');
          }
        } catch (error) {
          console.error('[PortfolioScreen] Error loading hide small balances preference:', error);
        }
      };
      loadHideSmallBalances();
    }, [])
  );

  // Fetch historical spot prices for time-based PnL
  useEffect(() => {
    const fetchHistoricalPrices = async () => {
      // For "All Time", no fetch needed - mark as loaded immediately
      if (timeFilter === 'All Time') {
        hasLoadedOnceRef.current.add('24h' as any);  // Type workaround
        return;
      }
      
      if (!infoClient || !account.data?.spotBalances) {
        return;
      }

      // CRITICAL: Wait for spot markets to load before fetching
      // if (!wsState.spotMarkets || wsState.spotMarkets.length === 0) {
      //   const timestamp = new Date().toISOString();
      //   console.log(`[${timestamp}] [PortfolioScreen] Waiting for spot markets to load (currently ${wsState.spotMarkets.length})`);
      //   return;
      // }

      const now = Date.now();
      const timestamp = new Date().toISOString();

      // Check if we've fetched recently (within last 10 seconds)
      const lastFetch = lastFetchTimeRef.current[timeFilter];
      if (lastFetch && now - lastFetch < 10000) {
        console.log(`[${timestamp}] [PortfolioScreen] Skipping fetch for ${timeFilter} - last fetched ${Math.round((now - lastFetch) / 1000)}s ago`);
        return;
      }
      
      setIsFetchingHistorical(true);
      
      const prices: Record<string, number> = {};

      // Configure time range and interval based on filter
      let startTime: number;
      let endTime: number;
      let interval: '1m' | '1h' | '1d';

      if (timeFilter === '24h') {
        // 24h: startTime = 24h ago, endTime = 23h 30m ago, interval = 1m
        startTime = now - 24 * 60 * 60 * 1000;
        endTime = now - 23.5 * 60 * 60 * 1000;
        interval = '1m';
      } else if (timeFilter === '7d') {
        // 7d: startTime = 7d ago, endTime = 6d 24h ago, interval = 1h
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        endTime = now - 6 * 24 * 60 * 60 * 1000;
        interval = '1h';
      } else {
        // 30d: startTime = 31d ago, endTime = 30d ago, interval = 1d
        startTime = now - 31 * 24 * 60 * 60 * 1000;
        endTime = now - 30 * 24 * 60 * 60 * 1000;
        interval = '1d';
      }

      const balancesToFetch = account.data.spotBalances.filter(
        (balance) => balance.coin !== 'USDC' && parseFloat(balance.total) > 0
      );

      // Batch requests with delays to avoid rate limiting
      for (let i = 0; i < balancesToFetch.length; i++) {
        const balance = balancesToFetch[i];

        // Find the spot market to get the full market name
        const spotMarket = wsState.spotMarkets.find(
          (m) => m.name.split('/')[0] === balance.coin
        );
        if (!spotMarket) {
          console.warn(`[${timestamp}] [PortfolioScreen] No spot market found for coin: ${balance.coin}`);
          continue;
        }
        
        console.log(`[${timestamp}] [PortfolioScreen] Found spot market for ${balance.coin}: ${spotMarket.name}`);

        try {
          // Use resolveSubscriptionCoin to get the proper API format (@{index} or literal name)
          const subscriptionCoin = resolveSubscriptionCoin('spot', spotMarket.name, wsState.spotMarkets);

          // Fetch candles with specified interval
          const candles = await infoClient.candleSnapshot({
            coin: subscriptionCoin,
            interval,
            startTime,
            endTime,
          });

          if (candles && candles.length > 0) {
            // Get the EARLIEST candle's open price (first candle in array)
            const historicalCandle = candles[0];
            if (historicalCandle && historicalCandle.o) {
              const historicalPrice = parseFloat(historicalCandle.o);
              prices[spotMarket.name] = historicalPrice;
              const candleTime = new Date(historicalCandle.t).toISOString();
              console.log(`[${timestamp}] [PortfolioScreen] ${spotMarket.name}: Historical price = $${historicalPrice} (candle from ${candleTime})`);
            }
          }
        } catch (error) {
          const errorTimestamp = new Date().toISOString();
          console.warn(`[${errorTimestamp}] [PortfolioScreen] Error fetching candles for ${spotMarket.name}:`, error);
        }

        // Add small delay between requests to avoid rate limiting
        if (i < balancesToFetch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update state for this specific time filter
      if (Object.keys(prices).length > 0) {
        setHistoricalSpotPrices(prev => {
          const updated = {
            ...prev,
            [timeFilter]: prices,  // Store prices under the specific time filter key
          };
          const finalTimestamp = new Date().toISOString();
          console.log(`[${finalTimestamp}] [PortfolioScreen] Updated historicalSpotPrices[${timeFilter}]:`, JSON.stringify(prices, null, 2));
          return updated;
        });
        
        // Mark this time filter as loaded at least once
        if (timeFilter === '24h' || timeFilter === '7d' || timeFilter === '30d') {
          hasLoadedOnceRef.current.add(timeFilter);
        }
      } else {
        const finalTimestamp = new Date().toISOString();
        console.log(`[${finalTimestamp}] [PortfolioScreen] No prices fetched for ${timeFilter}`);
      }

      // Update last fetch time for this specific time filter
      lastFetchTimeRef.current[timeFilter] = now;
      setIsFetchingHistorical(false);
    };

    fetchHistoricalPrices();
  }, [infoClient, account.data?.spotBalances, timeFilter, wsState.spotMarkets]);

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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PortfolioScreen] ======== Time filter changed to: ${filter} ========`);
    console.log(`[${timestamp}] [PortfolioScreen] Has loaded before: ${hasLoadedOnceRef.current.has(filter as '24h' | '7d' | '30d')}`);
    
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

  // Snapshot recent trades only when screen focuses or filters change, to avoid constant updates
  useEffect(() => {
    if (isFocused && marketFilter !== 'Staking') {
      setRecentTradesSnapshot(filteredFills);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, timeFilter, marketFilter]);

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
        // Find the spot market to get full market name for price lookup
        const spotMarket = wsState.spotMarkets.find(
          (m) => m.name.split('/')[0] === balance.coin
        );
        if (spotMarket) {
          const price = wsState.prices[spotMarket.name];
          if (price) {
            spotValue += total * parseFloat(price);
          }
        }
      }
    });
    return spotValue;
  }, [account.data?.spotBalances, wsState.prices, wsState.spotMarkets]);

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

    // Helper to calculate spot PnL
    const calculateSpotPnL = () => {
      const calcTimestamp = new Date().toISOString();
      let spotPnl = 0;
      const calcDetails: string[] = [];

      // Get historical prices for the current time filter
      const currentFilterPrices = timeFilter === 'All Time' 
        ? {} 
        : (historicalSpotPrices[timeFilter as '24h' | '7d' | '30d'] || {});

      console.log(`[${calcTimestamp}] [PortfolioScreen] calculateSpotPnL() called for ${timeFilter}`);
      console.log(`[${calcTimestamp}] [PortfolioScreen] historicalSpotPrices[${timeFilter}]:`, JSON.stringify(currentFilterPrices, null, 2));

      if (account.data?.spotBalances) {
        account.data.spotBalances.forEach((balance) => {
          if (balance.coin !== 'USDC' && parseFloat(balance.total) > 0) {
            // Find the spot market to get full market name
            const spotMarket = wsState.spotMarkets.find(
              (m) => m.name.split('/')[0] === balance.coin
            );
            
            if (!spotMarket) {
              calcDetails.push(`    ${balance.coin}: SKIPPED (spot market not found)`);
              return;
            }
            
            const marketName = spotMarket.name;
            const currentPrice = wsState.prices[marketName];
            
            if (!currentPrice) {
              calcDetails.push(`    ${marketName}: SKIPPED (no current price)`);
              return;
            }
            
            const total = parseFloat(balance.total);
            const currentValue = total * parseFloat(currentPrice);
            
            let baseValue;
            if (timeFilter === 'All Time') {
              // Use entry value for "All Time"
              baseValue = parseFloat(balance.entryNtl || '0');
              const pnl = currentValue - baseValue;
              spotPnl += pnl;
              calcDetails.push(`    ${marketName}: $${currentValue.toFixed(2)} - $${baseValue.toFixed(2)} (entry) = ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
            } else {
              // Use historical price for time-based filters (24h, 7d, 30d)
              const historicalPrice = currentFilterPrices[marketName];
              if (historicalPrice) {
                baseValue = total * historicalPrice;
                const pnl = currentValue - baseValue;
                spotPnl += pnl;
                calcDetails.push(`    ${marketName}: $${currentValue.toFixed(2)} - $${baseValue.toFixed(2)} (hist @ $${historicalPrice.toFixed(2)}) = ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
              } else {
                calcDetails.push(`    ${marketName}: SKIPPED (no historical price in state)`);
                // If no historical price yet, skip this balance
                return;
              }
            }
          }
        });
      }

      return spotPnl;
    };

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
      // Calculate unrealized PnL for spot balances
      uPnl += calculateSpotPnL();
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
      // Calculate unrealized PnL for spot balances
      uPnl += calculateSpotPnL();
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
      // Calculate unrealized PnL for spot balances
      uPnl += calculateSpotPnL();
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
    wsState.spotMarkets,
    perpAccountValue,
    spotTotalValue,
    stakingValue,
    filteredFills,
    marketFilter,
    timeFilter,
    historicalSpotPrices,
  ]);

  // Determine if we should show loading for spot PnL
  const isLoadingSpotPnL = useMemo(() => {
    // Only show loading for time-based filters (not All Time)
    if (timeFilter === 'All Time') return false;
    
    // Only show loading if we have spot balances and are viewing spot-related filters
    const hasSpotBalances = account.data?.spotBalances && account.data.spotBalances.some(b => b.coin !== 'USDC' && parseFloat(b.total) > 0);
    const isSpotFilter = ['Spot', 'Perp+Spot', 'Account'].includes(marketFilter);
    
    if (!hasSpotBalances || !isSpotFilter) return false;
    
    // Only show loading if this time filter has NEVER been loaded before
    const hasLoadedBefore = hasLoadedOnceRef.current.has(timeFilter as '24h' | '7d' | '30d');
    const shouldLoad = !hasLoadedBefore && isFetchingHistorical;
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PortfolioScreen] isLoadingSpotPnL check: hasLoadedBefore=${hasLoadedBefore}, isFetching=${isFetchingHistorical}, result=${shouldLoad}`);
    
    return shouldLoad;
  }, [timeFilter, isFetchingHistorical, marketFilter, account.data?.spotBalances]);

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
        // Get context key (HIP-3 positions use dex:coin format)
        const contextKey = getPositionContextKey(position.coin, position.dex);
        const price = wsState.prices[contextKey];
        const marginUsed = position.marginUsed
          ? parseFloat(position.marginUsed)
          : parseFloat(position.positionValue || '0') / (position.leverage?.value || 1);

        return {
          position,
          price,
          marginUsed,
          pnl: price ? calculatePositionPnL(position, price) : { pnl: 0, pnlPercent: 0 },
          assetContext: wsState.assetContexts[contextKey],
        };
      })
      .filter((item) => {
        // If hideSmallBalances is enabled, filter out positions with USD value < $10
        if (hideSmallBalances && item.marginUsed < 10) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.marginUsed - a.marginUsed);
  }, [account.data?.perpPositions, wsState.prices, wsState.assetContexts, hideSmallBalances]);

  // Prepare sorted spot balances with USD values and PnL
  const sortedSpotBalances = useMemo(() => {
    if (!account.data?.spotBalances) return [];

    return account.data.spotBalances
      .filter((balance) => parseFloat(balance.total) > 0)
      .map((balance) => {
        const total = parseFloat(balance.total);
        // USDC is always $1
        let price, usdValue, assetContext, pnl;
        if (balance.coin === 'USDC') {
          price = '1';
          usdValue = total;
          assetContext = wsState.assetContexts[balance.coin];
          // USDC has no PnL (it's always $1)
          pnl = { pnl: 0, pnlPercent: 0 };
        } else {
          // Find the spot market to get full market name for price lookup
          const spotMarket = wsState.spotMarkets.find(
            (m) => m.name.split('/')[0] === balance.coin
          );
          const marketName = spotMarket?.name || balance.coin;  // e.g., "UBTC/USDC"
          
          price = wsState.prices[marketName];  // Use full market name
          usdValue = price ? total * parseFloat(price) : 0;
          assetContext = wsState.assetContexts[marketName];  // Also use marketName here
          
          // Calculate spot PnL
          const entryValue = parseFloat(balance.entryNtl || '0');
          const pnlValue = usdValue - entryValue;
          const pnlPercent = entryValue > 0 ? (pnlValue / entryValue) * 100 : 0;
          pnl = { pnl: pnlValue, pnlPercent };
        }

        return {
          balance,
          price,
          total,
          usdValue,
          pnl,
          assetContext,
        };
      })
      .filter((item) => {
        // If hideSmallBalances is enabled, filter out balances with USD value < $10
        if (hideSmallBalances && item.usdValue < 10) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [account.data?.spotBalances, wsState.prices, wsState.assetContexts, wsState.spotMarkets, hideSmallBalances]);

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
    const getOrderMarketType = (coin: string, dex?: string): 'perp' | 'spot' | null => {
      const orderDex = dex || '';
      const perpMarket = wsState.perpMarkets.find((m) => m.name === coin && m.dex === orderDex);
      if (perpMarket) return 'perp';

      const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
      if (spotMarket) return 'spot';

      return null;
    };

    const filteredOrders = account.data.openOrders.filter((order: any) => {
      const orderMarketType = getOrderMarketType(order.coin, order.dex);

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
              // Group orders by dex
              const ordersByDex: Record<string, Array<{ a: number; o: number }>> = {};

              filteredOrders.forEach((order: any) => {
                const dex = order.dex || '';
                const perpMarket = wsState.perpMarkets.find(
                  (m) => m.name === order.coin && m.dex === dex
                );
                const spotMarket = wsState.spotMarkets.find(
                  (m) => m.name === order.coin || m.apiName === order.coin
                );

                let assetIndex: number;
                if (perpMarket) {
                  assetIndex = getAssetIdForMarket(perpMarket);
                } else if (spotMarket) {
                  assetIndex = 10000 + spotMarket.index;
                } else {
                  console.error('[PortfolioScreen] Market not found for order:', order.coin);
                  return; // Skip this order
                }

                if (!ordersByDex[dex]) {
                  ordersByDex[dex] = [];
                }
                ordersByDex[dex].push({ a: assetIndex, o: order.oid });
              });

              let successCount = 0;
              let failCount = 0;

              // Cancel orders for each dex separately
              for (const [dex, cancels] of Object.entries(ordersByDex)) {
                const client = getExchangeClientForDex(dex);
                if (!client) {
                  console.error('[PortfolioScreen] Failed to get client for dex:', dex);
                  failCount += cancels.length;
                  continue;
                }

                try {
                  console.log(`[PortfolioScreen] Canceling ${cancels.length} orders for dex: ${dex || 'default'}`);
                  await client.cancel({ cancels });
                  successCount += cancels.length;
                } catch (err: any) {
                  console.error(`[PortfolioScreen] Failed to cancel orders for dex ${dex}:`, err);
                  failCount += cancels.length;
                }
              }

              if (successCount > 0) {
                Alert.alert(
                  'Success',
                  `${successCount} order${successCount !== 1 ? 's' : ''} canceled successfully!${
                    failCount > 0 ? `\n${failCount} failed` : ''
                  }`
                );
              } else {
                Alert.alert('Error', 'Failed to cancel any orders');
              }

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
                const dex = item.position.dex;
                const size = parseFloat(item.position.szi);
                const market = wsState.perpMarkets.find((m) => m.name === coin && m.dex === (dex || ''));

                if (!market) {
                  console.error('[PortfolioScreen] Market not found for:', coin, 'dex:', dex);
                  failCount++;
                  continue;
                }

                const assetIndex = getAssetIdForMarket(market);
                const szDecimals = market.szDecimals || 4;
                const priceKey = dex ? `${dex}:${coin}` : coin;
                const currentPrice = parseFloat(wsState.prices[priceKey] || '0');

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
                  // Get dex-specific client for HIP-3 markets
                  const client = getExchangeClientForDex(dex || '');
                  if (!client) {
                    console.error('[PortfolioScreen] Failed to get exchange client for:', coin, 'dex:', dex);
                    failCount++;
                    continue;
                  }

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

                  console.log(`[PortfolioScreen] Closing position ${coin} (dex: ${dex || 'default'})...`);
                  await client.order(orderPayload);
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

    // Get market info - match by name AND dex for HIP-3 orders
    const dex = order.dex || '';
    const perpMarket = wsState.perpMarkets.find((m) => m.name === order.coin && m.dex === dex);
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
      assetIndex = getAssetIdForMarket(perpMarket);
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
              // Get dex-specific client for HIP-3 orders
              const client = getExchangeClientForDex(dex);
              if (!client) {
                Alert.alert('Error', 'Failed to get exchange client');
                return;
              }

              await client.cancel({
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

  const getOrderMarketType = (coin: string, dex?: string): 'perp' | 'spot' | null => {
    const orderDex = dex || '';
    const perpMarket = wsState.perpMarkets.find((m) => m.name === coin && m.dex === orderDex);
    if (perpMarket) return 'perp';

    const spotMarket = wsState.spotMarkets.find((m) => m.name === coin || m.apiName === coin);
    if (spotMarket) return 'spot';

    return null;
  };

  // Filter orders by market type
  const filteredOrders = useMemo(() => {
    if (!account.data?.openOrders) return [];

    return account.data.openOrders.filter((order: any) => {
      const orderMarketType = getOrderMarketType(order.coin, order.dex);

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
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Portfolio</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Time Period Filter */}
        <TimeFilterSelector selectedFilter={timeFilter} onFilterChange={handleTimeFilterChange} />

        {/* Entire content wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              contentInsetAdjustmentBehavior="never"
              scrollEnabled={!marketDropdownVisible}
            >
              {/* Market Filter Dropdown */}
              <MarketDropdown
                selectedFilter={marketFilter}
                isVisible={marketDropdownVisible}
                onToggle={() => setMarketDropdownVisible(!marketDropdownVisible)}
                onFilterChange={handleMarketFilterChange}
              />

              {/* Backdrop to close dropdown when tapping outside */}
              {marketDropdownVisible && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2500,
                  }}
                  activeOpacity={1}
                  onPress={() => setMarketDropdownVisible(false)}
                />
              )}

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
                      <LoadingBlob />
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
                        isLoadingPnL={isLoadingSpotPnL}
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
                      {recentTradesSnapshot.length > 0 && marketFilter !== 'Staking' && (
                        <RecentTradesContainer
                          trades={recentTradesSnapshot}
                          displayLimit={tradesDisplayLimit}
                          onShowMore={() => {
                            const cap = 200;
                            const total = Math.min(recentTradesSnapshot.length, cap);
                            // If already at or above the total (cap), collapse
                            if (tradesDisplayLimit >= total) {
                              return setTradesDisplayLimit(10);
                            }
                            if (tradesDisplayLimit === 10) return setTradesDisplayLimit(20);
                            if (tradesDisplayLimit === 20) return setTradesDisplayLimit(50);
                            const next = Math.min(tradesDisplayLimit + 300, total);
                            // Expand up to the cap/total; do not collapse here
                            setTradesDisplayLimit(next);
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


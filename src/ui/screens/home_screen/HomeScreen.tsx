import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount } from '@reown/appkit-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useSparklineDataOptional } from '../../../contexts/SparklineDataContext';
import { formatPrice, formatSize, getDisplayTicker, getHip3DisplayName } from '../../../lib/formatting';
import { getStarredTickers } from '../../../lib/starredTickers';
import { playNavToChartHaptic } from '../../../lib/haptics';
import { getPositionContextKey, parseMarketKey } from '../../../lib/markets';
import {
  logScreenMount,
  logScreenUnmount,
  logScreenFocus,
  logScreenBlur,
  logRender,
  logUserAction,
  logScreenFullyRendered,
} from '../../../lib/logger';
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
const HIDE_SMALL_BALANCES_KEY = '@hide_small_balances';
const SHOW_STAKING_BALANCES_KEY = '@show_staking_balances';

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
  const { account, exchangeClient, refetchAccount, resumePolling } = useWallet();
  const { state: wsState, selectCoin, setMarketType, infoClient } = useWebSocket();
  const sparklineContext = useSparklineDataOptional();
  const navigation = useNavigation<any>();
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('Account');
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [showStakingBalances, setShowStakingBalances] = useState(true);

  // For skeleton loading
  const [isReady] = useState(true);

  // State for historical spot prices (24h only)
  const [historical24hSpotPrices, setHistorical24hSpotPrices] = useState<Record<string, number>>({});
  const [isFetchingHistorical, setIsFetchingHistorical] = useState(false);
  const hasLoadedHistoricalOnce = useRef(false);
  const lastFetchTime = useRef<number>(0);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('HomeScreen');
    return () => {
      logScreenUnmount('HomeScreen');
    };
  }, []);

  // For starred tickers
  const [starredPerpTickers, setStarredPerpTickers] = useState<string[]>([]);
  const [starredSpotTickers, setStarredSpotTickers] = useState<string[]>([]);

  // For balance animation
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isIncrease, setIsIncrease] = useState<boolean | null>(null);

  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Defer rendering was removed to avoid initial flicker on first tab visit

  // Load saved market filter and hide small balances preference on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem(MARKET_FILTER_KEY);
        if (
          savedFilter &&
          (savedFilter === 'Perp' || savedFilter === 'Spot' || savedFilter === 'Account')
        ) {
          setMarketFilter(savedFilter as MarketFilter);
        }

        const hideSmallBalancesValue = await AsyncStorage.getItem(HIDE_SMALL_BALANCES_KEY);
        if (hideSmallBalancesValue !== null) {
          setHideSmallBalances(hideSmallBalancesValue === 'true');
        }

        const showStakingValue = await AsyncStorage.getItem(SHOW_STAKING_BALANCES_KEY);
        if (showStakingValue !== null) {
          setShowStakingBalances(showStakingValue === 'true');
        }
      } catch (error) {
        console.error('[HomeScreen] Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Track if screen is focused (for skipping updates when not visible)
  const isFocusedRef = useRef(true);

  // Load starred tickers and hide small balances preference when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;
      logScreenFocus('HomeScreen');
      resumePolling(); // Resume wallet polling when HomeScreen gains focus

      const loadStarredTickersAndPreferences = async () => {
        try {
          const perpStarred = await getStarredTickers('perp');
          const spotStarred = await getStarredTickers('spot');
          setStarredPerpTickers(perpStarred);
          setStarredSpotTickers(spotStarred);

          const hideSmallBalancesValue = await AsyncStorage.getItem(HIDE_SMALL_BALANCES_KEY);
          if (hideSmallBalancesValue !== null) {
            setHideSmallBalances(hideSmallBalancesValue === 'true');
          }

          const showStakingValue = await AsyncStorage.getItem(SHOW_STAKING_BALANCES_KEY);
          if (showStakingValue !== null) {
            setShowStakingBalances(showStakingValue === 'true');
          }
        } catch (error) {
          console.error('[HomeScreen] Error loading starred tickers and preferences:', error);
        }
      };
      loadStarredTickersAndPreferences();

      return () => {
        isFocusedRef.current = false;
        logScreenBlur('HomeScreen');
      };
    }, [resumePolling])
  );

  // Fetch historical spot prices for 24h PnL calculation
  useEffect(() => {
    const fetchHistorical24hPrices = async () => {
      if (!infoClient || !account.data?.spotBalances) {
        return;
      }

      const now = Date.now();
      
      // Check if we've fetched recently (within last 10 seconds)
      if (lastFetchTime.current && now - lastFetchTime.current < 10000) {
        return;
      }
      
      setIsFetchingHistorical(true);
      
      const prices: Record<string, number> = {};

      // 24h: startTime = 24h ago, endTime = 23h 30m ago, interval = 1m
      const startTime = now - 24 * 60 * 60 * 1000;
      const endTime = now - 23.5 * 60 * 60 * 1000;
      const interval = '1m';

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
          continue;
        }

        try {
          // Use the spot market's apiName for subscription (e.g., "@107" for HYPE/USDC)
          const subscriptionCoin = spotMarket.apiName || spotMarket.name;

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
            }
          }
        } catch (error) {
          console.warn(`[HomeScreen] Error fetching candles for ${spotMarket.name}:`, error);
        }

        // Add small delay between requests to avoid rate limiting
        if (i < balancesToFetch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 100ms to reduce rate limiting
        }
      }

      // Update state
      if (Object.keys(prices).length > 0) {
        setHistorical24hSpotPrices(prices);
        hasLoadedHistoricalOnce.current = true;
      }

      lastFetchTime.current = now;
      setIsFetchingHistorical(false);
    };

    fetchHistorical24hPrices();
  }, [infoClient, account.data?.spotBalances, wsState.spotMarkets]);

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
    logUserAction('HomeScreen', 'Filter changed', filter);
    
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

  // Calculate 24h PnL based on market filter
  const { pnl24h, showPnL } = useMemo(() => {
    if (!account.data) {
      return { pnl24h: 0, showPnL: false };
    }

    let unrealizedPnL = 0;
    let shouldShowPnL = false;

    // Helper to calculate spot PnL using 24h historical prices
    const calculateSpot24hPnL = () => {
      let spotPnl = 0;
      
      if (account.data?.spotBalances) {
        account.data.spotBalances.forEach((balance) => {
          if (balance.coin !== 'USDC' && parseFloat(balance.total) > 0) {
            // Find the spot market to get full market name
            const spotMarket = wsState.spotMarkets.find(
              (m) => m.name.split('/')[0] === balance.coin
            );
            
            if (!spotMarket) {
              return;
            }
            
            const marketName = spotMarket.name;
            const currentPrice = wsState.prices[marketName];
            
            if (!currentPrice) {
              return;
            }
            
            const total = parseFloat(balance.total);
            const currentValue = total * parseFloat(currentPrice);
            
            // Use historical price for 24h calculation
            const historicalPrice = historical24hSpotPrices[marketName];
            if (historicalPrice) {
              const historicalValue = total * historicalPrice;
              const pnl = currentValue - historicalValue;
              spotPnl += pnl;
            }
          }
        });
      }

      return spotPnl;
    };

    // Calculate PnL based on market filter
    if (marketFilter === 'Perp') {
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach((position) => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          unrealizedPnL += posPnl;
        }
      });
    } else if (marketFilter === 'Spot') {
      shouldShowPnL = true;
      // Calculate unrealized PnL for spot balances
      unrealizedPnL += calculateSpot24hPnL();
    } else if (marketFilter === 'Account') {
      shouldShowPnL = true;
      // Calculate unrealized PnL for perp positions
      account.data.perpPositions.forEach((position) => {
        const price = wsState.prices[position.coin];
        if (price) {
          const { pnl: posPnl } = calculatePositionPnL(position, price);
          unrealizedPnL += posPnl;
        }
      });
      // Calculate unrealized PnL for spot balances
      unrealizedPnL += calculateSpot24hPnL();
    }

    // Calculate realized PnL from fills in last 24h
    const now = Date.now();
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    const realizedPnL = account.data.userFills
      ? account.data.userFills
          .filter((fill) => fill.time >= cutoff24h)
          .reduce((sum, fill) => {
            const closedPnl = parseFloat(fill.closedPnl || '0');
            return sum + closedPnl;
          }, 0)
      : 0;

    const totalPnL = unrealizedPnL + realizedPnL;

    return {
      pnl24h: totalPnL,
      showPnL: shouldShowPnL,
    };
  }, [
    account.data,
    wsState.prices,
    wsState.spotMarkets,
    marketFilter,
    historical24hSpotPrices,
  ]);

  // Determine if we should show loading for spot PnL
  const isLoadingSpotPnL = useMemo(() => {
    // Only show loading if we have spot balances and are viewing spot-related filters
    const hasSpotBalances = account.data?.spotBalances && account.data.spotBalances.some(b => b.coin !== 'USDC' && parseFloat(b.total) > 0);
    const isSpotFilter = ['Spot', 'Account'].includes(marketFilter);
    
    if (!hasSpotBalances || !isSpotFilter) return false;
    
    // Only show loading if this has NEVER been loaded before
    const shouldLoad = !hasLoadedHistoricalOnce.current && isFetchingHistorical;
    
    return shouldLoad;
  }, [isFetchingHistorical, marketFilter, account.data?.spotBalances]);

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

  // Prepare sorted spot balances with USD values
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

  // Stable coin keys for sparkline prefetching (prevents re-runs on price changes)
  const perpCoinKeys = useMemo(() =>
    sortedPerpPositions.map(item => {
      const position = item.position;
      return position.dex ? `${position.dex}:${position.coin}` : position.coin;
    }).sort().join(','),
    [sortedPerpPositions]
  );

  const spotCoinKeys = useMemo(() =>
    sortedSpotBalances
      .filter(item => item.balance.coin !== 'USDC')
      .map(item => item.balance.coin)
      .sort().join(','),
    [sortedSpotBalances]
  );

  // Hydrate sparklines from SQLite cache for instant display
  useEffect(() => {
    if (!sparklineContext?.isCacheReady) return;

    const itemsToHydrate: Array<{ coin: string; marketType: 'perp' | 'spot' }> = [];

    // Add perp positions
    sortedPerpPositions.forEach(item => {
      const position = item.position;
      const coin = position.dex ? `${position.dex}:${position.coin}` : position.coin;
      itemsToHydrate.push({ coin, marketType: 'perp' });
    });

    // Add spot balances
    sortedSpotBalances
      .filter(item => item.balance.coin !== 'USDC')
      .forEach(item => {
        const spotMarket = wsState.spotMarkets.find(
          m => m.name.split('/')[0] === item.balance.coin
        );
        if (spotMarket) {
          itemsToHydrate.push({ coin: spotMarket.name, marketType: 'spot' });
        }
      });

    // Add starred tickers
    starredPerpTickers.forEach(ticker => {
      itemsToHydrate.push({ coin: ticker, marketType: 'perp' });
    });
    starredSpotTickers.forEach(ticker => {
      itemsToHydrate.push({ coin: ticker, marketType: 'spot' });
    });

    // Hydrate from SQLite cache (async, non-blocking)
    if (itemsToHydrate.length > 0) {
      sparklineContext.hydrateFromCache(itemsToHydrate);
    }
  }, [sparklineContext?.isCacheReady, sortedPerpPositions, sortedSpotBalances, starredPerpTickers, starredSpotTickers, wsState.spotMarkets]);

  // Prefetch sparklines for positions and balances (debounced)
  useEffect(() => {
    if (!sparklineContext) return;

    // Debounce to prevent rapid-fire API calls on price updates
    const timeoutId = setTimeout(() => {
      // Prefetch perp position sparklines
      const perpCoins = perpCoinKeys.split(',').filter(Boolean);
      if (perpCoins.length > 0) {
        sparklineContext.prefetchSparklines(perpCoins, 'perp');
      }

      // Prefetch spot balance sparklines
      const spotCoins = spotCoinKeys.split(',').filter(Boolean).map(coin => {
        const spotMarket = wsState.spotMarkets.find(
          m => m.name.split('/')[0] === coin
        );
        return spotMarket?.name || coin;
      });
      if (spotCoins.length > 0) {
        sparklineContext.prefetchSparklines(spotCoins, 'spot');
      }

      // Prefetch starred ticker sparklines
      if (starredPerpTickers.length > 0) {
        sparklineContext.prefetchSparklines(starredPerpTickers, 'perp');
      }
      if (starredSpotTickers.length > 0) {
        sparklineContext.prefetchSparklines(starredSpotTickers, 'spot');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [sparklineContext, perpCoinKeys, spotCoinKeys, starredPerpTickers, starredSpotTickers, wsState.spotMarkets]);

  // Prepare starred tickers with data
  const starredTickersData = useMemo(() => {
    const perpData: Array<{
      name: string;
      displayName: string;
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
    // Supports both "BTC" (regular) and "xyz:NVDA" (HIP-3) formats
    if (
      (marketFilter === 'Perp' || marketFilter === 'Account') &&
      starredPerpTickers.length > 0
    ) {
      starredPerpTickers.forEach((ticker) => {
        // Parse ticker to handle both "BTC" and "xyz:NVDA" formats
        const { coin, dex } = parseMarketKey(ticker);

        // Use ticker directly as context key (already in correct format)
        const ctx = wsState.assetContexts[ticker];
        const price = ctx?.markPx || 0;
        const prevPrice = ctx?.prevDayPx || price;
        const priceChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
        const volume = ctx?.dayNtlVlm || 0;

        // Find market using parsed coin and dex
        const market = wsState.perpMarkets.find((m) => m.name === coin && m.dex === (dex || ''));
        const leverage = market?.maxLeverage || 1;

        if (price > 0 && volume > 0) {
          perpData.push({
            name: ticker,
            displayName: getHip3DisplayName(coin, dex || ''),
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
        
        // For spot tickers, apply display mapping (e.g., "UBTC/USDC" → "BTC/USDC")
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

  // Log rendering of components (only when screen is focused to reduce noise)
  useEffect(() => {
    if (account.data && isFocusedRef.current) {
      if (marketFilter === 'Perp' || marketFilter === 'Account') {
        logRender('PerpPositionsContainer', `${sortedPerpPositions.length} positions`);
      }
      if (marketFilter === 'Spot' || marketFilter === 'Account') {
        logRender('SpotBalancesContainer', `${sortedSpotBalances.length} balances`);
      }
      if (marketFilter === 'Account') {
        logRender('StarredTickersContainer', `${starredTickersData.perpData.length + starredTickersData.spotData.length} tickers`);
      }
      logScreenFullyRendered('HomeScreen');
    }
  }, [account.data, sortedPerpPositions.length, sortedSpotBalances.length, marketFilter]);

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
    <SafeAreaView edges={['top']} style={styles.container}>
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
            <ScrollView
              style={styles.scrollView}
              contentInsetAdjustmentBehavior="never"
            >
              <BalanceContent
                balance={displayedBalance}
                showDepositButton={marketFilter === 'Account' && displayedBalance === 0}
                onDepositPress={() => setDepositModalVisible(true)}
                textColor={textColor}
                pnl24h={pnl24h}
                showPnL={showPnL}
                isLoadingPnL={isLoadingSpotPnL}
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
                      getSparklineData={sparklineContext?.getSparklineData}
                    />
                  )}

                  {/* Spot Balances */}
                  {(marketFilter === 'Spot' || marketFilter === 'Account') && (
                    <SpotBalancesContainer
                      sortedBalances={sortedSpotBalances}
                      spotMarkets={wsState.spotMarkets}
                      onNavigateToChart={handleNavigateToChart}
                      showLabel={marketFilter === 'Account'}
                      getSparklineData={sparklineContext?.getSparklineData}
                    />
                  )}

                  {/* Staking Balance */}
                  {marketFilter === 'Account' && showStakingBalances && account.data?.stakingDelegations && (
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
                    getSparklineData={sparklineContext?.getSparklineData}
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


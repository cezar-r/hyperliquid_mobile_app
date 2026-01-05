import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, Keyboard, Animated, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useSparklineDataOptional } from '../../../contexts/SparklineDataContext';
import type { PerpMarket, SpotMarket } from '../../../types';
import { getStarredTickers } from '../../../lib/starredTickers';
import { getDisplayTicker, getHip3DisplayName } from '../../../lib/formatting';
import { playToggleHaptic, playNavToChartHaptic } from '../../../lib/haptics';
import { getMarketContextKey, getPositionContextKey } from '../../../lib/markets';
import {
  logScreenMount,
  logScreenUnmount,
  logScreenFocus,
  logScreenBlur,
  logRender,
  logUserAction,
  logScreenFullyRendered,
} from '../../../lib/logger';
import { styles } from './styles/SearchScreen.styles';
import { Color } from '../../shared/styles';
import { PanelSelector, MarketCell, EmptyState, SkeletonScreen } from '../../shared/components';
import { SearchBar, SortButtons, SortType } from './components';

// Helper function to format large numbers
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

// Helper function to format percentage
function formatPercent(num: number | undefined | null): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0.00%';
  }
  return `${(num * 100).toFixed(2)}%`;
}

interface SearchScreenProps {
  onTickerSelect?: (marketName: string) => void;
}

export default function SearchScreen({ onTickerSelect }: SearchScreenProps = {}): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const sparklineContext = useSparklineDataOptional();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSort, setCurrentSort] = useState<SortType>(SortType.VOLUME);
  const [isAscending, setIsAscending] = useState(false);

  // For skeleton loading
  const [isReady] = useState(true);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('SearchScreen');
    return () => {
      logScreenUnmount('SearchScreen');
    };
  }, []);

  // Store sort preferences per market type
  const [perpSort, setPerpSort] = useState<SortType>(SortType.VOLUME);
  const [spotSort, setSpotSort] = useState<SortType>(SortType.VOLUME);
  const [perpAscending, setPerpAscending] = useState(false);
  const [spotAscending, setSpotAscending] = useState(false);

  // Global starred filter state (applies to both perp and spot)
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [starredTickers, setStarredTickers] = useState<string[]>([]);

  // HIP-3 filter state (only applies to perp)
  const [showHip3Only, setShowHip3Only] = useState(false);

  // For swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Defer rendering was removed to avoid initial flicker on first tab visit

  // Load filter preferences from AsyncStorage on mount
  React.useEffect(() => {
    const loadFilterPreferences = async () => {
      try {
        const [starFilter, hip3Filter] = await Promise.all([
          AsyncStorage.getItem('search_star_filter'),
          AsyncStorage.getItem('search_hip3_filter'),
        ]);
        if (starFilter !== null) {
          setShowStarredOnly(starFilter === 'true');
        }
        if (hip3Filter !== null) {
          setShowHip3Only(hip3Filter === 'true');
        }
      } catch (error) {
        console.error('[SearchScreen] Failed to load filter preferences:', error);
      }
    };

    loadFilterPreferences();
  }, []);

  // Restore sort preferences when market type changes
  React.useEffect(() => {
    if (wsState.marketType === 'perp') {
      setCurrentSort(perpSort);
      setIsAscending(perpAscending);
    } else {
      setCurrentSort(spotSort);
      setIsAscending(spotAscending);
    }
  }, [wsState.marketType, perpSort, spotSort, perpAscending, spotAscending]);

  // Load starred tickers when screen comes into focus or market type changes
  useFocusEffect(
    useCallback(() => {
      logScreenFocus('SearchScreen');
      
      const loadStarredTickers = async () => {
        const starred = await getStarredTickers(wsState.marketType);
        setStarredTickers(starred);
      };

      loadStarredTickers();
      
      return () => {
        logScreenBlur('SearchScreen');
      };
    }, [wsState.marketType])
  );

  const currentMarkets = useMemo(
    () => (wsState.marketType === 'perp' ? wsState.perpMarkets : wsState.spotMarkets),
    [wsState.marketType, wsState.perpMarkets, wsState.spotMarkets]
  );

  // Get sort options based on market type
  const sortOptions = useMemo(() => {
    if (wsState.marketType === 'perp') {
      return [
        SortType.ALPHABETICAL,
        SortType.VOLUME,
        SortType.CHANGE,
        SortType.FUNDING,
        SortType.LEVERAGE,
        SortType.OPEN_INTEREST,
      ];
    } else {
      return [SortType.ALPHABETICAL, SortType.VOLUME, SortType.CHANGE, SortType.MARKET_CAP];
    }
  }, [wsState.marketType]);

  const handleSortPress = useCallback(
    (sortType: SortType) => {
      if (currentSort === sortType) {
        const newAscending = !isAscending;
        setIsAscending(newAscending);

        // Save to market type specific state
        if (wsState.marketType === 'perp') {
          setPerpAscending(newAscending);
        } else {
          setSpotAscending(newAscending);
        }
      } else {
        setCurrentSort(sortType);
        setIsAscending(false);

        // Save to market type specific state
        if (wsState.marketType === 'perp') {
          setPerpSort(sortType);
          setPerpAscending(false);
        } else {
          setSpotSort(sortType);
          setSpotAscending(false);
        }
      }
    },
    [currentSort, isAscending, wsState.marketType]
  );

  const getSortedAndFilteredMarkets = useMemo((): (PerpMarket | SpotMarket)[] => {
    // Filter by search query (starts with)
    let filtered: (PerpMarket | SpotMarket)[] = currentMarkets;
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = currentMarkets.filter((m) => {
        // Support searching by ticker name (e.g., "SPACEX")
        if (m.name.toLowerCase().startsWith(lower)) {
          return true;
        }
        // For HIP-3 perps, also support searching by prefixed format (e.g., "vntl:SPACEX")
        if (wsState.marketType === 'perp') {
          const perpMarket = m as PerpMarket;
          if (perpMarket.dex) {
            const prefixedName = `${perpMarket.dex}:${perpMarket.name}`.toLowerCase();
            if (prefixedName.startsWith(lower)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Filter out spot tickers with 0 volume
    if (wsState.marketType === 'spot') {
      filtered = filtered.filter((m) => {
        const ctx = wsState.assetContexts[m.name];
        const volume = ctx?.dayNtlVlm || 0;
        return volume > 0;
      });
    }

    // Filter by HIP-3 toggle (only applies to perp)
    if (wsState.marketType === 'perp') {
      if (showHip3Only) {
        // Show only HIP-3 markets
        filtered = filtered.filter((m) => {
          const perpMarket = m as PerpMarket;
          return !!perpMarket.dex;
        });
      } else {
        // Default: hide HIP-3 markets
        filtered = filtered.filter((m) => {
          const perpMarket = m as PerpMarket;
          return !perpMarket.dex;
        });
      }
    }

    // Filter by starred tickers if active
    // For perp markets, use market key (dex:coin format for HIP-3) to match starred tickers
    if (showStarredOnly) {
      filtered = filtered.filter((m) => {
        if (wsState.marketType === 'perp') {
          const marketKey = getMarketContextKey(m as PerpMarket);
          return starredTickers.includes(marketKey);
        }
        return starredTickers.includes(m.name);
      });
    }

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      // Use correct context keys for HIP-3 dexes
      const aContextKey = wsState.marketType === 'perp' 
        ? getMarketContextKey(a as PerpMarket)
        : a.name;
      const bContextKey = wsState.marketType === 'perp'
        ? getMarketContextKey(b as PerpMarket)
        : b.name;
      
      const aCtx = wsState.assetContexts[aContextKey];
      const bCtx = wsState.assetContexts[bContextKey];
      
      let comparison = 0;

      switch (currentSort) {
        case SortType.VOLUME:
          const aVol = aCtx?.dayNtlVlm || 0;
          const bVol = bCtx?.dayNtlVlm || 0;
          comparison = aVol - bVol;
          break;
        case SortType.LEVERAGE:
          if (wsState.marketType === 'perp') {
            comparison = (a as PerpMarket).maxLeverage - (b as PerpMarket).maxLeverage;
          }
          break;
        case SortType.CHANGE:
          // Get correct price keys for HIP-3 dexes
          const aPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(a as PerpMarket)
            : a.name;
          const bPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(b as PerpMarket)
            : b.name;
          
          // Get current prices based on market type
          const aCurrentPrice =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[a.name] || '0')
              : aCtx?.markPx || parseFloat(wsState.prices[aPriceKey] || '0');
          const bCurrentPrice =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[b.name] || '0')
              : bCtx?.markPx || parseFloat(wsState.prices[bPriceKey] || '0');

          const aPrevPrice = aCtx?.prevDayPx || 0;
          const bPrevPrice = bCtx?.prevDayPx || 0;

          const aChange = aPrevPrice ? (aCurrentPrice - aPrevPrice) / aPrevPrice : 0;
          const bChange = bPrevPrice ? (bCurrentPrice - bPrevPrice) / bPrevPrice : 0;
          comparison = aChange - bChange;
          break;
        case SortType.ALPHABETICAL:
          comparison = b.name.localeCompare(a.name);
          break;
        case SortType.FUNDING:
          const aFunding = aCtx?.funding || 0;
          const bFunding = bCtx?.funding || 0;
          comparison = aFunding - bFunding;
          break;
        case SortType.OPEN_INTEREST:
          // Get correct price keys for HIP-3 dexes
          const aOIPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(a as PerpMarket)
            : a.name;
          const bOIPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(b as PerpMarket)
            : b.name;
          
          // Open interest is in tokens, multiply by price for USD value
          const aOIPx =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[a.name] || '0')
              : aCtx?.markPx || parseFloat(wsState.prices[aOIPriceKey] || '0');
          const bOIPx =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[b.name] || '0')
              : bCtx?.markPx || parseFloat(wsState.prices[bOIPriceKey] || '0');
          const aOI = (aCtx?.openInterest || 0) * aOIPx;
          const bOI = (bCtx?.openInterest || 0) * bOIPx;
          comparison = aOI - bOI;
          break;
        case SortType.MARKET_CAP:
          // Get correct price keys for HIP-3 dexes
          const aMCPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(a as PerpMarket)
            : a.name;
          const bMCPriceKey = wsState.marketType === 'perp'
            ? getMarketContextKey(b as PerpMarket)
            : b.name;
          
          const aMCPx =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[a.name] || '0')
              : aCtx?.markPx || parseFloat(wsState.prices[aMCPriceKey] || '0');
          const bMCPx =
            wsState.marketType === 'spot'
              ? parseFloat(wsState.prices[b.name] || '0')
              : bCtx?.markPx || parseFloat(wsState.prices[bMCPriceKey] || '0');
          const aMC = aCtx?.circulatingSupply ? aCtx.circulatingSupply * aMCPx : 0;
          const bMC = bCtx?.circulatingSupply ? bCtx.circulatingSupply * bMCPx : 0;
          comparison = aMC - bMC;
          break;
      }

      return isAscending ? comparison : -comparison;
    });

    return sorted;
  }, [
    currentMarkets,
    wsState.assetContexts,
    wsState.marketType,
    wsState.prices,
    searchQuery,
    currentSort,
    isAscending,
    showStarredOnly,
    starredTickers,
    showHip3Only,
  ]);

  // Log rendering (must come after getSortedAndFilteredMarkets is defined)
  useEffect(() => {
    if (getSortedAndFilteredMarkets.length > 0) {
      logRender('SearchScreen', `${getSortedAndFilteredMarkets.length} markets (${wsState.marketType})`);
      logScreenFullyRendered('SearchScreen');
    }
  }, [getSortedAndFilteredMarkets.length, wsState.marketType]);

  const handleMarketSelect = useCallback(
    (marketName: string): void => {
      logUserAction('SearchScreen', 'Navigate to chart', marketName);
      // Play haptic feedback
      playNavToChartHaptic();

      Keyboard.dismiss();
      selectCoin(marketName);
      
      // If onTickerSelect is provided, call it instead of navigating
      if (onTickerSelect) {
        onTickerSelect(marketName);
      } else {
        navigation.navigate('ChartDetail');
      }
    },
    [selectCoin, navigation, onTickerSelect]
  );

  const handleMarketTypeToggle = useCallback(
    (type: 'perp' | 'spot', animated: boolean = false, direction?: 'left' | 'right'): void => {
      logUserAction('SearchScreen', 'Market type changed', type);
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

      setMarketType(type);
    },
    [setMarketType, slideAnim]
  );

  const handleMarketSwipe = useCallback(
    (direction: 'left' | 'right') => {
      // Swipe left: perp -> spot
      // Swipe right: spot -> perp
      const nextType =
        direction === 'left'
          ? wsState.marketType === 'perp'
            ? 'spot'
            : 'perp'
          : wsState.marketType === 'spot'
            ? 'perp'
            : 'spot';
      handleMarketTypeToggle(nextType, true, direction);
    },
    [wsState.marketType, handleMarketTypeToggle]
  );

  const handleStarFilterToggle = useCallback(() => {
    const newState = !showStarredOnly;
    setShowStarredOnly(newState);

    // Persist to AsyncStorage
    AsyncStorage.setItem('search_star_filter', String(newState)).catch((error) => {
      console.error('[SearchScreen] Failed to save star filter preference:', error);
    });
  }, [showStarredOnly]);

  const handleHip3FilterToggle = useCallback(() => {
    const newState = !showHip3Only;
    setShowHip3Only(newState);

    // Persist to AsyncStorage
    AsyncStorage.setItem('search_hip3_filter', String(newState)).catch((error) => {
      console.error('[SearchScreen] Failed to save HIP-3 filter preference:', error);
    });
  }, [showHip3Only]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const keyExtractor = useCallback((item: PerpMarket | SpotMarket) => item.name, []);

  const getSortValue = useCallback(
    (item: PerpMarket | SpotMarket) => {
      // Get correct context key for HIP-3 dexes
      const contextKey = wsState.marketType === 'perp' 
        ? getMarketContextKey(item as PerpMarket)
        : item.name;
      const ctx = wsState.assetContexts[contextKey];

      // Get price based on market type
      let price = 0;
      if (wsState.marketType === 'spot') {
        price = parseFloat(wsState.prices[item.name] || '0');
      } else {
        price = ctx?.markPx || parseFloat(wsState.prices[contextKey] || '0');
      }

      const prevPrice = ctx?.prevDayPx || 0;
      const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;

      switch (currentSort) {
        case SortType.VOLUME:
          return formatLargeNumber(ctx?.dayNtlVlm || 0);
        case SortType.OPEN_INTEREST:
          // Open interest is in tokens, multiply by price to get USD value
          const openInterestUSD = (ctx?.openInterest || 0) * price;
          return formatLargeNumber(openInterestUSD);
        case SortType.MARKET_CAP:
          const marketCap =
            ctx?.circulatingSupply && ctx?.markPx ? ctx.circulatingSupply * ctx.markPx : 0;
          return formatLargeNumber(marketCap);
        case SortType.CHANGE:
        case SortType.ALPHABETICAL:
        case SortType.LEVERAGE:
          return `${pctChange >= 0 ? '+' : ''}${formatPercent(pctChange)}`;
        case SortType.FUNDING:
          const funding = ctx?.funding || 0;
          return `${(funding * 100).toFixed(5)}%`;
        default:
          return '';
      }
    },
    [wsState.assetContexts, wsState.marketType, wsState.prices, currentSort]
  );

  const getSortValueColor = useCallback(
    (item: PerpMarket | SpotMarket) => {
      // Get context key (HIP-3 dexes use dex:coin format)
      const contextKey = wsState.marketType === 'perp' 
        ? getMarketContextKey(item as PerpMarket)
        : item.name;
      const ctx = wsState.assetContexts[contextKey];
      const price = ctx?.markPx || 0;
      const prevPrice = ctx?.prevDayPx || 0;
      const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;

      switch (currentSort) {
        case SortType.VOLUME:
        case SortType.OPEN_INTEREST:
        case SortType.MARKET_CAP:
          return Color.FG_3;
        case SortType.FUNDING:
          return (ctx?.funding || 0) > 0 ? Color.BRIGHT_ACCENT : Color.RED;
        default:
          return pctChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED;
      }
    },
    [wsState.assetContexts, wsState.marketType, currentSort]
  );

  const get24hChangeColor = useCallback(
    (item: PerpMarket | SpotMarket) => {
      // Get context key (HIP-3 dexes use dex:coin format)
      const contextKey = wsState.marketType === 'perp' 
        ? getMarketContextKey(item as PerpMarket)
        : item.name;
      const ctx = wsState.assetContexts[contextKey];

      // Get price based on market type
      let price = 0;
      if (wsState.marketType === 'spot') {
        price = parseFloat(wsState.prices[item.name] || '0');
      } else {
        price = ctx?.markPx || parseFloat(wsState.prices[contextKey] || '0');
      }

      const prevPrice = ctx?.prevDayPx || 0;
      const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;
      return pctChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED;
    },
    [wsState.assetContexts, wsState.prices, wsState.marketType]
  );

  const get24hChangeValue = useCallback(
    (item: PerpMarket | SpotMarket) => {
      // Get correct context key for HIP-3 dexes
      const contextKey = wsState.marketType === 'perp' 
        ? getMarketContextKey(item as PerpMarket)
        : item.name;
      const ctx = wsState.assetContexts[contextKey];

      // Get price based on market type
      let price = 0;
      if (wsState.marketType === 'spot') {
        price = parseFloat(wsState.prices[item.name] || '0');
      } else {
        price = ctx?.markPx || parseFloat(wsState.prices[contextKey] || '0');
      }

      const prevPrice = ctx?.prevDayPx || 0;
      const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;
      return `${pctChange >= 0 ? '+' : ''}${formatPercent(pctChange)}`;
    },
    [wsState.assetContexts, wsState.prices, wsState.marketType]
  );

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket | SpotMarket }) => {
      // Get context key (HIP-3 dexes use dex:coin format)
      const contextKey = wsState.marketType === 'perp'
        ? getMarketContextKey(item as PerpMarket)
        : item.name;
      const ctx = wsState.assetContexts[contextKey];

      // Get price - for spot, use prices map, for perp use markPx
      let price = 0;
      if (wsState.marketType === 'spot') {
        price = parseFloat(wsState.prices[item.name] || '0');
      } else {
        // For perps, use context key for price lookup too
        const priceKey = contextKey;
        price = ctx?.markPx || parseFloat(wsState.prices[priceKey] || '0');
      }

      // Check if we should show metric under ticker (for volume, funding, OI, market cap)
      const showMetricUnderTicker =
        currentSort === SortType.VOLUME ||
        currentSort === SortType.FUNDING ||
        currentSort === SortType.OPEN_INTEREST ||
        currentSort === SortType.MARKET_CAP;

      const dex = wsState.marketType === 'perp'
        ? (item as PerpMarket).dex
        : undefined;
      const displayName = wsState.marketType === 'spot'
        ? getDisplayTicker(item.name)
        : getHip3DisplayName(item.name, dex || '');
      const leverage = wsState.marketType === 'perp'
        ? (item as PerpMarket).maxLeverage
        : undefined;

      // For HIP-3 markets, use dex:coin format to preserve dex context
      const marketKey = dex ? `${dex}:${item.name}` : item.name;

      // Get sparkline data if available
      const sparklineData = sparklineContext?.getSparklineData(marketKey, wsState.marketType) ?? null;

      return (
        <MarketCell
          displayName={displayName}
          price={price}
          priceChange={
            ctx && ctx.prevDayPx
              ? (price - ctx.prevDayPx) / ctx.prevDayPx
              : 0
          }
          priceChangeColor={get24hChangeColor(item)}
          leverage={leverage}
          dex={dex} // Pass dex for HIP-3 badge display
          metricValue={showMetricUnderTicker ? getSortValue(item) : undefined}
          metricColor={getSortValueColor(item)}
          showMetricBelow={showMetricUnderTicker}
          sparklineData={sparklineData}
          onPress={() => handleMarketSelect(marketKey)}
        />
      );
    },
    [
      wsState.assetContexts,
      wsState.marketType,
      wsState.prices,
      currentSort,
      handleMarketSelect,
      getSortValue,
      getSortValueColor,
      get24hChangeColor,
      get24hChangeValue,
      sparklineContext,
    ]
  );

  // Viewability config for sparkline prefetching
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 30,
    minimumViewTime: 150,
  }).current;

  // Handle viewable items changed to prefetch sparklines
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!sparklineContext) return;

      const coins = viewableItems
        .filter(item => item.isViewable && item.item)
        .map(item => {
          const market = item.item as PerpMarket | SpotMarket;
          const dex = wsState.marketType === 'perp' ? (market as PerpMarket).dex : undefined;
          return dex ? `${dex}:${market.name}` : market.name;
        });

      if (coins.length > 0) {
        sparklineContext.prefetchSparklines(coins, wsState.marketType);
      }
    },
    [sparklineContext, wsState.marketType]
  );

  // Ref for viewability callback (required for FlatList)
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  // Pan gesture for horizontal swipe (market type)
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { velocityX, translationX } = event;

      // Check if gesture is predominantly horizontal and fast enough
      if (Math.abs(velocityX) > 500 || Math.abs(translationX) > 100) {
        if (translationX < -50) {
          // Swipe left
          runOnJS(handleMarketSwipe)('left');
        } else if (translationX > 50) {
          // Swipe right
          runOnJS(handleMarketSwipe)('right');
        }
      }
    })
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20]);

  const marketsHydrated = currentMarkets.length > 0;

  if (!isReady || !marketsHydrated) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Perp/Spot Toggle */}
        <PanelSelector
          options={['Perp', 'Spot']}
          selectedOption={wsState.marketType === 'perp' ? 'Perp' : 'Spot'}
          onOptionChange={(option) =>
            handleMarketTypeToggle(option === 'Perp' ? 'perp' : 'spot')
          }
        />

        {/* Entire content wrapped with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            {/* Search Bar */}
            <SearchBar
              searchQuery={searchQuery}
              onChangeText={setSearchQuery}
              onClear={handleClearSearch}
            />

            {/* Sort Buttons */}
            <SortButtons
              sortOptions={sortOptions}
              currentSort={currentSort}
              isAscending={isAscending}
              showStarredOnly={showStarredOnly}
              showHip3Only={showHip3Only}
              showHip3Toggle={wsState.marketType === 'perp'}
              onSortPress={handleSortPress}
              onStarFilterToggle={handleStarFilterToggle}
              onHip3FilterToggle={handleHip3FilterToggle}
            />

            {/* Market List */}
            <FlatList
              style={styles.marketList}
              data={getSortedAndFilteredMarkets}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="never"
              initialNumToRender={20}
              windowSize={7}
              maxToRenderPerBatch={20}
              removeClippedSubviews
              viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
              ListEmptyComponent={
                <EmptyState
                  message="No markets found"
                  submessage="Try a different search term"
                />
              }
              extraData={{
                prices: wsState.prices,
                marketType: wsState.marketType,
                currentSort,
                isAscending,
                sparklineContext,
              }}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}


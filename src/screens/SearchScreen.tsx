import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { PerpMarket, SpotMarket } from '../types';
import { styles } from './styles/SearchScreen.styles';
import Color from '../styles/colors';

// Sort types enum
enum SortType {
  ALPHABETICAL = 'A-Z',
  VOLUME = '24h Volume',
  CHANGE = '24h Change %',
  FUNDING = 'Funding',
  LEVERAGE = 'Leverage',
  OPEN_INTEREST = 'Open Interest',
  MARKET_CAP = 'Market Cap',
}

// Helper function to format large numbers
function formatLargeNumber(num: number | undefined | null): string {
  // Check if num is actually a number and is finite
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

// Helper function to format price
function formatPrice(num: number | undefined | null, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

// Helper function to format percentage
function formatPercent(num: number | undefined | null): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0.00%';
  }
  return `${(num * 100).toFixed(2)}%`;
}

export default function SearchScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSort, setCurrentSort] = useState<SortType>(SortType.VOLUME);
  const [isAscending, setIsAscending] = useState(false);
  
  // Store sort preferences per market type
  const [perpSort, setPerpSort] = useState<SortType>(SortType.VOLUME);
  const [spotSort, setSpotSort] = useState<SortType>(SortType.VOLUME);
  const [perpAscending, setPerpAscending] = useState(false);
  const [spotAscending, setSpotAscending] = useState(false);

  // Restore sort when market type changes
  React.useEffect(() => {
    if (wsState.marketType === 'perp') {
      setCurrentSort(perpSort);
      setIsAscending(perpAscending);
    } else {
      setCurrentSort(spotSort);
      setIsAscending(spotAscending);
    }
  }, [wsState.marketType, perpSort, spotSort, perpAscending, spotAscending]);

  // Debug logging for spot markets (reduced)
  React.useEffect(() => {
    if (wsState.marketType === 'spot' && wsState.spotMarkets.length > 0) {
      const spotContextsCount = wsState.spotMarkets.filter(m => wsState.assetContexts[m.name]).length;
      const spotPricesCount = wsState.spotMarkets.filter(m => wsState.prices[m.name]).length;
      console.log(`[SearchScreen] Spot markets: ${wsState.spotMarkets.length}, with contexts: ${spotContextsCount}, with prices: ${spotPricesCount}`);
    }
  }, [wsState.marketType, wsState.spotMarkets.length]);

  const currentMarkets = useMemo(
    () =>
      wsState.marketType === 'perp'
        ? wsState.perpMarkets
        : wsState.spotMarkets,
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
      return [
        SortType.ALPHABETICAL,
        SortType.VOLUME,
        SortType.CHANGE,
        SortType.MARKET_CAP,
      ];
    }
  }, [wsState.marketType]);

  const handleSortPress = useCallback((sortType: SortType) => {
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
  }, [currentSort, isAscending, wsState.marketType]);

  const getSortedAndFilteredMarkets = useMemo((): (PerpMarket | SpotMarket)[] => {
    // Filter by search query (starts with)
    let filtered: (PerpMarket | SpotMarket)[] = currentMarkets;
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = currentMarkets.filter((m) =>
        m.name.toLowerCase().startsWith(lower)
      );
    }

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      const aCtx = wsState.assetContexts[a.name];
      const bCtx = wsState.assetContexts[b.name];
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
          // Get current prices based on market type
          const aCurrentPrice = wsState.marketType === 'spot' 
            ? parseFloat(wsState.prices[a.name] || '0')
            : (aCtx?.markPx || 0);
          const bCurrentPrice = wsState.marketType === 'spot'
            ? parseFloat(wsState.prices[b.name] || '0')
            : (bCtx?.markPx || 0);
          
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
          // Open interest is in tokens, multiply by price for USD value
          const aOIPx = wsState.marketType === 'spot'
            ? parseFloat(wsState.prices[a.name] || '0')
            : (aCtx?.markPx || 0);
          const bOIPx = wsState.marketType === 'spot'
            ? parseFloat(wsState.prices[b.name] || '0')
            : (bCtx?.markPx || 0);
          const aOI = (aCtx?.openInterest || 0) * aOIPx;
          const bOI = (bCtx?.openInterest || 0) * bOIPx;
          comparison = aOI - bOI;
          break;
        case SortType.MARKET_CAP:
          const aMCPx = wsState.marketType === 'spot'
            ? parseFloat(wsState.prices[a.name] || '0')
            : (aCtx?.markPx || 0);
          const bMCPx = wsState.marketType === 'spot'
            ? parseFloat(wsState.prices[b.name] || '0')
            : (bCtx?.markPx || 0);
          const aMC = aCtx?.circulatingSupply
            ? aCtx.circulatingSupply * aMCPx
            : 0;
          const bMC = bCtx?.circulatingSupply
            ? bCtx.circulatingSupply * bMCPx
            : 0;
          comparison = aMC - bMC;
          break;
      }

      return isAscending ? comparison : -comparison;
    });

    return sorted;
  }, [currentMarkets, wsState.assetContexts, wsState.marketType, wsState.prices, searchQuery, currentSort, isAscending]);

  const handleMarketSelect = useCallback((marketName: string): void => {
    Keyboard.dismiss();
    selectCoin(marketName);
    navigation.navigate('ChartDetail');
  }, [selectCoin, navigation]);

  const handleMarketTypeToggle = useCallback(
    (type: 'perp' | 'spot'): void => {
      setMarketType(type);
    },
    [setMarketType]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const keyExtractor = useCallback(
    (item: PerpMarket | SpotMarket) => item.name,
    []
  );

  const getSortValue = useCallback((item: PerpMarket | SpotMarket) => {
    const ctx = wsState.assetContexts[item.name];
    
    // Get price based on market type
    let price = 0;
    if (wsState.marketType === 'spot') {
      price = parseFloat(wsState.prices[item.name] || '0');
    } else {
      price = ctx?.markPx || 0;
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
        const marketCap = ctx?.circulatingSupply && ctx?.markPx
          ? ctx.circulatingSupply * ctx.markPx
          : 0;
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
  }, [wsState.assetContexts, currentSort]);

  const getSortValueColor = useCallback((item: PerpMarket | SpotMarket) => {
    const ctx = wsState.assetContexts[item.name];
    const price = ctx?.markPx || 0;
    const prevPrice = ctx?.prevDayPx || 0;
    const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;

    switch (currentSort) {
      case SortType.VOLUME:
      case SortType.OPEN_INTEREST:
        return Color.FG_3;
      case SortType.MARKET_CAP:
        return Color.BRIGHT_ACCENT;
      case SortType.FUNDING:
        return (ctx?.funding || 0) > 0 ? Color.BRIGHT_ACCENT : Color.RED;
      default:
        return pctChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED;
    }
  }, [wsState.assetContexts, currentSort]);
  
  const get24hChangeColor = useCallback((item: PerpMarket | SpotMarket) => {
    const ctx = wsState.assetContexts[item.name];
    
    // Get price based on market type
    let price = 0;
    if (wsState.marketType === 'spot') {
      price = parseFloat(wsState.prices[item.name] || '0');
    } else {
      price = ctx?.markPx || 0;
    }
    
    const prevPrice = ctx?.prevDayPx || 0;
    const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;
    return pctChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED;
  }, [wsState.assetContexts, wsState.prices, wsState.marketType]);

  const get24hChangeValue = useCallback((item: PerpMarket | SpotMarket) => {
    const ctx = wsState.assetContexts[item.name];
    
    // Get price based on market type
    let price = 0;
    if (wsState.marketType === 'spot') {
      price = parseFloat(wsState.prices[item.name] || '0');
    } else {
      price = ctx?.markPx || 0;
    }
    
    const prevPrice = ctx?.prevDayPx || 0;
    const pctChange = prevPrice ? (price - prevPrice) / prevPrice : 0;
    return `${pctChange >= 0 ? '+' : ''}${formatPercent(pctChange)}`;
  }, [wsState.assetContexts, wsState.prices, wsState.marketType]);

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket | SpotMarket }) => {
      const ctx = wsState.assetContexts[item.name];
      
      // Get price - for spot, use prices map, for perp use markPx
      let price = 0;
      if (wsState.marketType === 'spot') {
        price = parseFloat(wsState.prices[item.name] || '0');
      } else {
        price = ctx?.markPx || 0;
      }
      
      // Check if we should show metric under ticker (for volume, funding, OI)
      const showMetricUnderTicker = 
        currentSort === SortType.VOLUME || 
        currentSort === SortType.FUNDING || 
        currentSort === SortType.OPEN_INTEREST;

      return (
        <View>
          <TouchableOpacity
            style={styles.tickerCell}
            onPress={() => handleMarketSelect(item.name)}
          >
            <View style={styles.tickerLeftContainer}>
              <View style={styles.tickerNameRow}>
                <Text style={styles.tickerSymbol}>{item.name}</Text>
                {wsState.marketType === 'perp' && (
                  <Text style={styles.leverage}>
                    {(item as PerpMarket).maxLeverage}x
                  </Text>
                )}
              </View>
              {showMetricUnderTicker && (
                <Text
                  style={[
                    styles.tickerMetricBelow,
                    { color: getSortValueColor(item) },
                  ]}
                >
                  {getSortValue(item)}
                </Text>
              )}
            </View>
            <View style={styles.tickerRightContainer}>
              <Text style={styles.tickerPrice}>
                ${formatPrice(price)}
              </Text>
              <Text
                style={[
                  styles.tickerMetric,
                  { color: get24hChangeColor(item) },
                ]}
              >
                {get24hChangeValue(item)}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
        </View>
      );
    },
    [
      wsState.assetContexts,
      wsState.marketType,
      currentSort,
      handleMarketSelect,
      getSortValue,
      getSortValueColor,
      get24hChangeColor,
      get24hChangeValue,
    ]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Perp/Spot Toggle */}
        <View style={styles.marketTypeSection}>
          <View style={styles.panelSelector}>
            <TouchableOpacity
              style={[
                styles.panelButton,
                wsState.marketType === 'perp' && styles.panelButtonActive,
              ]}
              onPress={() => handleMarketTypeToggle('perp')}
            >
              <Text
                style={[
                  styles.panelText,
                  wsState.marketType === 'perp' && styles.panelTextActive,
                ]}
              >
                PERP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.panelButton,
                wsState.marketType === 'spot' && styles.panelButtonActive,
              ]}
              onPress={() => handleMarketTypeToggle('spot')}
            >
              <Text
                style={[
                  styles.panelText,
                  wsState.marketType === 'spot' && styles.panelTextActive,
                ]}
              >
                SPOT
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.separatorContainer}>
            <View
              style={[
                styles.separatorSegment,
                wsState.marketType === 'perp' && styles.separatorActive,
              ]}
            />
            <View
              style={[
                styles.separatorSegment,
                wsState.marketType === 'spot' && styles.separatorActive,
              ]}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Color.BRIGHT_ACCENT}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder=""
            placeholderTextColor={Color.FG_3}
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={20} color={Color.BRIGHT_ACCENT} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Buttons */}
        <View style={styles.sortHeaderContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScrollContent}
          >
            {sortOptions.map((sortType) => (
              <TouchableOpacity
                key={sortType}
                style={[
                  styles.sortButton,
                  currentSort === sortType && styles.sortButtonActive,
                ]}
                onPress={() => handleSortPress(sortType)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    currentSort === sortType && styles.sortButtonTextActive,
                  ]}
                >
                  {sortType}
                </Text>
                {currentSort === sortType && (
                  <Ionicons
                    name={isAscending ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Color.BG_2}
                    style={styles.sortIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Market List */}
        <FlatList
          style={styles.marketList}
          data={getSortedAndFilteredMarkets}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No markets found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
            </View>
          }
          extraData={{
            prices: wsState.prices,
            marketType: wsState.marketType,
            currentSort,
            isAscending,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

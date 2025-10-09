import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { PerpMarket, SpotMarket } from '../types';
import { styles } from './styles/SearchScreen.styles';

export default function SearchScreen(): React.JSX.Element {
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');

  const currentMarkets = useMemo(
    () =>
      wsState.marketType === 'perp'
        ? wsState.perpMarkets
        : wsState.spotMarkets,
    [wsState.marketType, wsState.perpMarkets, wsState.spotMarkets]
  );

  const filteredMarkets = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = currentMarkets.filter((m) =>
      m.name.toLowerCase().includes(lower)
    );
    filtered.sort((a, b) => {
      const aCtx = wsState.assetContexts[a.name];
      const bCtx = wsState.assetContexts[b.name];
      const aVol = aCtx?.dayNtlVlm || 0;
      const bVol = bCtx?.dayNtlVlm || 0;
      return bVol - aVol;
    });
    return filtered;
  }, [currentMarkets, wsState.assetContexts, searchQuery]);

  const handleMarketSelect = useCallback((marketName: string): void => {
    selectCoin(marketName);
  }, [selectCoin]);

  const handleMarketTypeToggle = useCallback(
    (type: 'perp' | 'spot'): void => {
      setMarketType(type);
    },
    [setMarketType]
  );

  const keyExtractor = useCallback(
    (item: PerpMarket | SpotMarket) => item.name,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: PerpMarket | SpotMarket }) => {
      const isSelected = wsState.selectedCoin === item.name;
      const price = wsState.prices[item.name];
      const ctx = wsState.assetContexts[item.name];
      const volume = ctx?.dayNtlVlm;
      const change24h =
        ctx?.markPx && ctx?.prevDayPx
          ? ((ctx.markPx - ctx.prevDayPx) / ctx.prevDayPx) * 100
          : null;

      return (
        <TouchableOpacity
          style={[
            styles.marketItem,
            isSelected && styles.marketItemSelected,
          ]}
          onPress={() => handleMarketSelect(item.name)}
        >
          <View style={styles.marketItemLeft}>
            <Text style={styles.marketName}>{item.name}</Text>
            <View style={styles.marketBadges}>
              {wsState.marketType === 'perp' && (
                <Text style={styles.marketLeverage}>
                  {(item as PerpMarket).maxLeverage}x
                </Text>
              )}
              {change24h !== null && (
                <Text
                  style={[
                    styles.marketChange,
                    change24h >= 0
                      ? styles.marketChangePositive
                      : styles.marketChangeNegative,
                  ]}
                >
                  {change24h >= 0 ? '+' : ''}
                  {change24h.toFixed(2)}%
                </Text>
              )}
            </View>
          </View>
          <View style={styles.marketItemRight}>
            {price ? (
              <>
                <Text style={styles.marketPrice}>${price}</Text>
                {volume !== undefined && (
                  <Text style={styles.marketVolume}>
                    Vol: {(volume / 1000000).toFixed(2)}M
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.marketPriceLoading}>...</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [
      wsState.selectedCoin,
      wsState.prices,
      wsState.assetContexts,
      wsState.marketType,
      handleMarketSelect,
    ]
  );

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        data={filteredMarkets}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        windowSize={7}
        maxToRenderPerBatch={20}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Markets</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  wsState.marketType === 'perp' &&
                    styles.toggleButtonActive,
                ]}
                onPress={() => handleMarketTypeToggle('perp')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    wsState.marketType === 'perp' &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  PERP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  wsState.marketType === 'spot' &&
                    styles.toggleButtonActive,
                ]}
                onPress={() => handleMarketTypeToggle('spot')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    wsState.marketType === 'spot' &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  SPOT
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search markets..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <Text style={styles.resultsCount}>
              {filteredMarkets.length} markets
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No markets found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        }
        extraData={{
          selectedCoin: wsState.selectedCoin,
          prices: wsState.prices,
          marketType: wsState.marketType,
        }}
      />
    </View>
  );
}


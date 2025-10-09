import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { PerpMarket, SpotMarket } from '../types';
import { styles } from './styles/SearchScreen.styles';

export default function SearchScreen(): React.JSX.Element {
  const { state: wsState, selectCoin, setMarketType } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');

  const currentMarkets =
    wsState.marketType === 'perp' ? wsState.perpMarkets : wsState.spotMarkets;

  const filteredMarkets = currentMarkets
    .filter((market) =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aCtx = wsState.assetContexts[a.name];
      const bCtx = wsState.assetContexts[b.name];
      const aVolume = aCtx?.dayNtlVlm || 0;
      const bVolume = bCtx?.dayNtlVlm || 0;
      return bVolume - aVolume;
    });

  const handleMarketSelect = (marketName: string): void => {
    selectCoin(marketName);
  };

  const handleMarketTypeToggle = (type: 'perp' | 'spot'): void => {
    setMarketType(type);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Markets</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              wsState.marketType === 'perp' && styles.toggleButtonActive,
            ]}
            onPress={() => handleMarketTypeToggle('perp')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                wsState.marketType === 'perp' && styles.toggleButtonTextActive,
              ]}
            >
              PERP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              wsState.marketType === 'spot' && styles.toggleButtonActive,
            ]}
            onPress={() => handleMarketTypeToggle('spot')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                wsState.marketType === 'spot' && styles.toggleButtonTextActive,
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

        <View style={styles.marketList}>
          {filteredMarkets.map((market) => {
            const isSelected = wsState.selectedCoin === market.name;
            const price = wsState.prices[market.name];
            const ctx = wsState.assetContexts[market.name];
            
            const volume = ctx?.dayNtlVlm;
            const change24h =
              ctx?.markPx && ctx?.prevDayPx
                ? ((ctx.markPx - ctx.prevDayPx) / ctx.prevDayPx) * 100
                : null;

            return (
              <TouchableOpacity
                key={market.name}
                style={[
                  styles.marketItem,
                  isSelected && styles.marketItemSelected,
                ]}
                onPress={() => handleMarketSelect(market.name)}
              >
                <View style={styles.marketItemLeft}>
                  <Text style={styles.marketName}>{market.name}</Text>
                  <View style={styles.marketBadges}>
                    {wsState.marketType === 'perp' && (
                      <Text style={styles.marketLeverage}>
                        {(market as PerpMarket).maxLeverage}x
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
                          Vol: ${(volume / 1000000).toFixed(2)}M
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.marketPriceLoading}>...</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredMarkets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No markets found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


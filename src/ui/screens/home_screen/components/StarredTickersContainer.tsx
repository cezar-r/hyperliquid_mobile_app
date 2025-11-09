import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/StarredTickersContainer.styles';
import { MarketCell } from '../../../shared/components';

// Helper to format large numbers (for volume display)
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

type MarketFilter = 'Perp' | 'Spot' | 'Account';

interface StarredTickersContainerProps {
  perpData: Array<{
    name: string;
    price: number;
    priceChange: number;
    volume: number;
    leverage: number;
    marketType: 'perp';
  }>;
  spotData: Array<{
    name: string;
    displayName: string;
    price: number;
    priceChange: number;
    volume: number;
    marketType: 'spot';
  }>;
  marketFilter: MarketFilter;
  onNavigateToChart: (coin: string, market: 'perp' | 'spot') => void;
}

export default function StarredTickersContainer({
  perpData,
  spotData,
  marketFilter,
  onNavigateToChart,
}: StarredTickersContainerProps): React.JSX.Element | null {
  if (perpData.length === 0 && spotData.length === 0) {
    return null;
  }

  return (
    <View style={styles.starredSection}>
      {/* Starred Perp Tickers */}
      {perpData.length > 0 && (
        <View>
          {marketFilter === 'Account' && (
            <View style={styles.sectionLabelWithIcon}>
              <MaterialIcons
                name="star"
                size={16}
                color={Color.GOLD}
                style={styles.starIcon}
              />
              <Text style={styles.sectionLabel}>Perps</Text>
            </View>
          )}
          {marketFilter === 'Perp' && (
            <View style={styles.sectionLabelWithIcon}>
              <MaterialIcons
                name="star"
                size={16}
                color={Color.GOLD}
                style={styles.starIcon}
              />
              <Text style={styles.sectionLabel}>Starred</Text>
            </View>
          )}
          {perpData.map((item) => (
            <MarketCell
              key={`starred-perp-${item.name}`}
              displayName={item.name}
              price={item.price}
              priceChange={item.priceChange}
              priceChangeColor={item.priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED}
              leverage={item.leverage}
              metricValue={formatLargeNumber(item.volume)}
              metricColor={Color.FG_3}
              showMetricBelow={true}
              onPress={() => onNavigateToChart(item.name, 'perp')}
            />
          ))}
        </View>
      )}

      {/* Starred Spot Tickers */}
      {spotData.length > 0 && (
        <View
          style={
            marketFilter === 'Account' && perpData.length > 0
              ? styles.spotSection
              : undefined
          }
        >
          {marketFilter === 'Account' && (
            <View style={[styles.sectionLabelWithIcon, { paddingTop: 6 }]}>
              <MaterialIcons
                name="star"
                size={16}
                color={Color.GOLD}
                style={styles.starIcon}
              />
              <Text style={[styles.balancesLabel, { marginBottom: 0, paddingTop: 0 }]}>
                Spot
              </Text>
            </View>
          )}
          {marketFilter === 'Spot' && (
            <View style={styles.sectionLabelWithIcon}>
              <MaterialIcons
                name="star"
                size={16}
                color={Color.GOLD}
                style={styles.starIcon}
              />
              <Text style={styles.sectionLabel}>Starred</Text>
            </View>
          )}
          {spotData.map((item) => (
            <MarketCell
              key={`starred-spot-${item.name}`}
              displayName={item.displayName}
              price={item.price}
              priceChange={item.priceChange}
              priceChangeColor={item.priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED}
              metricValue={formatLargeNumber(item.volume)}
              metricColor={Color.FG_3}
              showMetricBelow={true}
              onPress={() => onNavigateToChart(item.name, 'spot')}
            />
          ))}
        </View>
      )}
    </View>
  );
}


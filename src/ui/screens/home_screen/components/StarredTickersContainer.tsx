import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/StarredTickersContainer.styles';
import { MarketCell } from '../../../shared/components';
import { useLiveSparklineData } from '../../../../hooks';
import type { MarketType } from '../../../../types';

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

// Wrapper component to use live sparkline hook for each ticker
interface LiveMarketCellProps {
  name: string;
  displayName: string;
  price: number;
  priceChange: number;
  volume: number;
  leverage?: number;
  marketType: MarketType;
  onPress: () => void;
}

function LiveMarketCell({
  name,
  displayName,
  price,
  priceChange,
  volume,
  leverage,
  marketType,
  onPress,
}: LiveMarketCellProps): React.JSX.Element {
  // Get live sparkline data (historical + current price)
  const sparklineData = useLiveSparklineData(name, marketType, name);

  return (
    <MarketCell
      displayName={displayName}
      price={price}
      priceChange={priceChange}
      priceChangeColor={priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED}
      leverage={leverage}
      metricValue={formatLargeNumber(volume)}
      metricColor={Color.FG_3}
      showMetricBelow={true}
      sparklineData={sparklineData}
      onPress={onPress}
    />
  );
}

interface StarredTickersContainerProps {
  perpData: Array<{
    name: string;
    displayName: string;
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

function StarredTickersContainer({
  perpData,
  spotData,
  marketFilter,
  onNavigateToChart,
}: StarredTickersContainerProps): React.JSX.Element | null {
  if (perpData.length === 0 && spotData.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, styles.starredSection]}>
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
            <LiveMarketCell
              key={`starred-perp-${item.name}`}
              name={item.name}
              displayName={item.displayName}
              price={item.price}
              priceChange={item.priceChange}
              volume={item.volume}
              leverage={item.leverage}
              marketType="perp"
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
            <LiveMarketCell
              key={`starred-spot-${item.name}`}
              name={item.name}
              displayName={item.displayName}
              price={item.price}
              priceChange={item.priceChange}
              volume={item.volume}
              marketType="spot"
              onPress={() => onNavigateToChart(item.name, 'spot')}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders from parent
export default React.memo(StarredTickersContainer);


import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../styles';
import { styles } from './styles/MarketCell.styles';

interface MarketCellProps {
  displayName: string;
  price: number;
  priceChange: number;
  priceChangeColor: string;
  leverage?: number;
  metricValue?: string;
  metricColor?: string;
  showMetricBelow?: boolean;
  dex?: string; // HIP-3 dex name (e.g., 'xyz', 'vntl')
  onPress: () => void;
}

// Helper to format price
function formatPrice(num: number, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

// Helper to format percentage
function formatPercent(num: number, decimals: number = 2): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${(num * 100).toFixed(decimals)}%`;
}

export default function MarketCell({
  displayName,
  price,
  priceChange,
  priceChangeColor,
  leverage,
  metricValue,
  metricColor = Color.FG_3,
  showMetricBelow = false,
  dex,
  onPress,
}: MarketCellProps): React.JSX.Element {
  return (
    <View>
      <TouchableOpacity style={styles.tickerCell} onPress={onPress}>
        <View style={styles.tickerLeftContainer}>
          <View style={styles.tickerNameRow}>
            <Text style={styles.tickerSymbol}>{displayName}</Text>
            {dex && (
              <View style={styles.dexBadge}>
                <Text style={styles.dexBadgeText}>{dex.toUpperCase()}</Text>
              </View>
            )}
            {leverage && (
              <Text style={styles.leverage}>{leverage}x</Text>
            )}
          </View>
          {showMetricBelow && metricValue && (
            <Text style={[styles.tickerMetricBelow, { color: metricColor }]}>
              {metricValue}
            </Text>
          )}
        </View>
        <View style={styles.tickerRightContainer}>
          <Text style={styles.tickerPrice}>${formatPrice(price)}</Text>
          <Text style={[styles.tickerMetric, { color: priceChangeColor }]}>
            {formatPercent(priceChange)}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />
    </View>
  );
}


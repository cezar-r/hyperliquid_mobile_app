import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../styles';
import { styles } from './styles/MarketCell.styles';
import Sparkline from '../sparkline/Sparkline';
import type { SparklineData } from '../sparkline';
import { MarqueeView } from '../marquee';

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
  sparklineData?: SparklineData | null;
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

function MarketCellComponent({
  displayName,
  price,
  priceChange,
  priceChangeColor,
  leverage,
  metricValue,
  metricColor = Color.FG_3,
  showMetricBelow = false,
  dex,
  sparklineData,
  onPress,
}: MarketCellProps): React.JSX.Element {
  // Split displayName into ticker and collateral (e.g., "XYZ100-USDC" -> "XYZ100", "USDC")
  const dashIndex = displayName.indexOf('-');
  const ticker = dashIndex > 0 ? displayName.substring(0, dashIndex) : displayName;
  const collateral = dashIndex > 0 ? displayName.substring(dashIndex + 1) : '';

  // Determine if we need the marquee (has collateral, dex, or leverage to scroll)
  const hasScrollableContent = collateral || dex || leverage;

  return (
    <View style={styles.cellWrapper}>
      <TouchableOpacity style={styles.tickerCell} onPress={onPress}>
        <View style={styles.tickerLeftContainer}>
          <View style={styles.tickerNameRow}>
            <Text style={styles.tickerSymbol}>{ticker}</Text>
            {hasScrollableContent && (
              <MarqueeView>
                <View style={styles.tickerBadgeRow}>
                  {collateral && (
                    <Text style={styles.tickerCollateral}>- {collateral}</Text>
                  )}
                  {dex && (
                    <View style={styles.dexBadge}>
                      <Text style={styles.dexBadgeText}>
                        {dex.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {leverage && (
                    <Text style={styles.leverage}>{leverage}x</Text>
                  )}
                </View>
              </MarqueeView>
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
      {sparklineData && sparklineData.points.length > 0 && (
        <View style={styles.sparklineOverlay} pointerEvents="none">
          <Sparkline
            data={sparklineData.points}
            isPositive={sparklineData.isPositive}
            fillContainer
          />
        </View>
      )}
      <View style={styles.separator} />
    </View>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(MarketCellComponent);


import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { styles } from '../styles/ChartHeader.styles';

interface ChartHeaderProps {
  onBackPress: () => void;
  ticker: string;
  displayTicker: string;
  marketType: 'perp' | 'spot';
  maxLeverage?: number;
  currentPrice: number | string | null;
  animatedPriceColor: Animated.AnimatedInterpolation<string | number>;
  change24h: number | null;
  stats: Array<{
    label: string;
    value: string;
    isPositive?: boolean;
    isNegative?: boolean;
  }>;
}

// Helper function to format large numbers
function formatLargeNumber(num: number | string): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

// Helper function to format price with commas
function formatPrice(price: number | string): string {
  const value = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(value)) return '0';
  
  // Determine decimal places based on price magnitude
  let decimals = 2;
  if (value < 0.01) {
    decimals = 6;
  } else if (value < 1) {
    decimals = 4;
  } else if (value < 100) {
    decimals = 2;
  } else if (value >= 1000) {
    decimals = 1;
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Helper function to format percentage
function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export default function ChartHeader({
  onBackPress,
  ticker,
  displayTicker,
  marketType,
  maxLeverage,
  currentPrice,
  animatedPriceColor,
  change24h,
  stats,
}: ChartHeaderProps): React.JSX.Element {
  return (
    <View style={styles.tickerHeader}>
      <View style={styles.backButtonRow}>
        <TouchableOpacity 
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tickerTopRow}>
        <View style={styles.tickerLeftGroup}>
          <Text style={styles.tickerName}>{displayTicker}</Text>
          {marketType === 'perp' && maxLeverage && (
            <View style={styles.leverageBadge}>
              <Text style={styles.leverageText}>{maxLeverage}x</Text>
            </View>
          )}
        </View>
        <View style={styles.priceRightGroup}>
          {currentPrice != null && (
            <Animated.Text style={[styles.currentPrice, { color: animatedPriceColor }]}>
              ${formatPrice(currentPrice)}
            </Animated.Text>
          )}
          {change24h != null && (
            <Text style={change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative}>
              {formatPercentage(change24h)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.tickerBottomRow}>
        <Text style={styles.marketTypeLabel}>
          {marketType === 'perp' ? 'Perpetual' : 'Spot'}
        </Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.statsScrollView}
          contentContainerStyle={styles.statsRowContainer}
        >
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statLabel}>{stat.label}: </Text>
              <Text style={
                stat.isPositive ? styles.statValuePositive :
                stat.isNegative ? styles.statValueNegative :
                styles.statValue
              }>
                {stat.value}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}



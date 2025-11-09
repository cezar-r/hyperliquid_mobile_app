import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '../../styles';
// import { getDisplayTicker } from '../../../lib/formatting';
import { styles } from './styles/PositionCell.styles';

interface PositionCellProps {
  // Common props
  ticker: string;
  displayName?: string;
  price: number;
  priceChange: number;
  value: number;
  subValue: string;
  subValueColor?: string;
  onPress: () => void;
  
  // Perp-specific props
  isPerp?: boolean;
  leverage?: number;
  leverageType?: string;
  isLong?: boolean;
  pnlPercent?: number;
  tpPrice?: number | null;
  slPrice?: number | null;
  showTpSl?: boolean;
  onEditTpSl?: () => void;
  
  // UI props
  showSeparator?: boolean;
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 5): string {
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

export default function PositionCell({
  ticker,
  displayName,
  price,
  priceChange,
  value,
  subValue,
  subValueColor,
  onPress,
  isPerp = false,
  leverage,
  leverageType,
  isLong,
  pnlPercent,
  tpPrice,
  slPrice,
  showTpSl = false,
  onEditTpSl,
  showSeparator = true,
}: PositionCellProps): React.JSX.Element {
  const displayTicker = displayName || ticker;
  
  // Format TP/SL display
  const tpDisplay = tpPrice && tpPrice > 0 ? tpPrice.toFixed(2) : '--';
  const slDisplay = slPrice && slPrice > 0 ? slPrice.toFixed(2) : '--';

  return (
    <View>
      <TouchableOpacity style={styles.positionCell} onPress={onPress}>
        <View style={styles.leftSide}>
          <View style={styles.tickerContainer}>
            <Text style={styles.ticker}>{displayTicker}</Text>
            {isPerp && leverage && (
              <>
                <Text
                  style={[
                    styles.leverage,
                    { color: isLong ? Color.BRIGHT_ACCENT : Color.RED },
                  ]}
                >
                  {leverage}x
                </Text>
                {leverageType && (
                  <Text style={styles.leverageTypeBadge}>{leverageType}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.size}>${formatNumber(price)}</Text>
            <Text
              style={[
                styles.priceChange,
                { color: priceChange >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
              ]}
            >
              {formatPercent(priceChange)}
            </Text>
            {showTpSl && onEditTpSl && (
              <TouchableOpacity
                style={styles.tpslContainer}
                onPress={(e) => {
                  e.stopPropagation();
                  onEditTpSl();
                }}
              >
                <Text style={styles.tpslInline}>
                  TP/SL {tpDisplay}/{slDisplay}
                </Text>
                <MaterialIcons
                  name="edit"
                  size={14}
                  color={Color.BRIGHT_ACCENT}
                  style={styles.editTpslIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.rightSide}>
          <Text style={styles.price}>${formatNumber(value, 2)}</Text>
          {isPerp && pnlPercent !== undefined && leverage ? (
            <View style={styles.priceContainer}>
              <Text style={[styles.pnl, subValueColor && { color: subValueColor }]}>
                {subValue}
              </Text>
              <Text
                style={[
                  styles.priceChange,
                  subValueColor && { color: subValueColor },
                ]}
              >
                {formatPercent((pnlPercent / 100) * leverage)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.pnl, subValueColor && { color: subValueColor }]}>
              {subValue}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
}



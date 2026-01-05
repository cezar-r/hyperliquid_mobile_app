import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';
import { positionCellStyles } from '../styles/PositionCell.styles';
import { Sparkline } from '../../../shared/components';
import type { SparklineData } from '../../../shared/components';
import type { SpotBalance } from '../../../../types';

interface SpotBalanceCellProps {
  balance: SpotBalance;
  price: string | undefined;
  total: number;
  usdValue: number;
  pnl: {
    pnl: number;
    pnlPercent: number;
  };
  assetContext?: any;
  displayName: string;
  sparklineData?: SparklineData | null;
  onPress: () => void;
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

function SpotBalanceCellComponent({
  balance,
  price,
  total,
  usdValue,
  pnl,
  assetContext,
  displayName,
  sparklineData,
  onPress,
}: SpotBalanceCellProps): React.JSX.Element {
  const parsedPrice = price ? parseFloat(price) : 0;

  // Calculate 24h change
  const prevDayPx = assetContext?.prevDayPx || parsedPrice;
  const priceChange = parsedPrice - prevDayPx;
  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;

  return (
    <View style={positionCellStyles.cellWrapper}>
      <TouchableOpacity style={sharedStyles.positionCell} onPress={onPress}>
        <View style={sharedStyles.leftSide}>
          <View style={sharedStyles.tickerContainer}>
            <Text style={sharedStyles.ticker}>{displayName}</Text>
          </View>
          <View style={sharedStyles.priceContainer}>
            <Text style={sharedStyles.size}>${formatNumber(parsedPrice)}</Text>
            <Text
              style={[
                sharedStyles.priceChange,
                { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
              ]}
            >
              {formatPercent(priceChangePct)}
            </Text>
          </View>
        </View>
        <View style={sharedStyles.rightSide}>
          <Text style={sharedStyles.price}>${formatNumber(usdValue, 2)}</Text>
          <View style={sharedStyles.priceContainer}>
            <Text
              style={[
                sharedStyles.pnl,
                { color: pnl.pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
              ]}
            >
              {pnl.pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(pnl.pnl), 2)}
            </Text>
            <Text
              style={[
                sharedStyles.priceChange,
                { color: pnl.pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED },
              ]}
            >
              {formatPercent(pnl.pnlPercent / 100)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {sparklineData && sparklineData.points.length > 0 && (
        <View style={positionCellStyles.sparklineOverlay} pointerEvents="none">
          <Sparkline
            data={sparklineData.points}
            isPositive={sparklineData.isPositive}
            fillContainer
          />
        </View>
      )}
      <View style={sharedStyles.separator} />
    </View>
  );
}

export default React.memo(SpotBalanceCellComponent);


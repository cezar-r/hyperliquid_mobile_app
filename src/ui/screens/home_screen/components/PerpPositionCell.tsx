import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';
import type { PerpPosition } from '../../../../types';

interface PerpPositionCellProps {
  position: PerpPosition;
  price: string | undefined;
  marginUsed: number;
  pnl: {
    pnl: number;
    pnlPercent: number;
  };
  assetContext?: any;
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

export default function PerpPositionCell({
  position,
  price,
  marginUsed,
  pnl,
  assetContext,
  onPress,
}: PerpPositionCellProps): React.JSX.Element {
  const positionSize = parseFloat(position.szi);
  const isLong = positionSize > 0;
  const leverage = position.leverage?.value || 1;
  const leverageType = position.leverage?.type
    ? position.leverage.type.charAt(0).toUpperCase() + position.leverage.type.slice(1)
    : 'Cross';
  const parsedPrice = price ? parseFloat(price) : 0;

  // Calculate 24h change
  const prevDayPx = assetContext?.prevDayPx || parsedPrice;
  const priceChange = parsedPrice - prevDayPx;
  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;

  return (
    <View>
      <TouchableOpacity style={sharedStyles.positionCell} onPress={onPress}>
        <View style={sharedStyles.leftSide}>
          <View style={sharedStyles.tickerContainer}>
            <Text style={sharedStyles.ticker}>{position.coin}</Text>
            <Text
              style={[
                sharedStyles.leverage,
                { color: isLong ? Color.BRIGHT_ACCENT : Color.RED },
              ]}
            >
              {leverage}x
            </Text>
            <Text style={sharedStyles.leverageTypeBadge}>{leverageType}</Text>
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
          <Text style={sharedStyles.price}>${formatNumber(marginUsed, 2)}</Text>
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
              {formatPercent((pnl.pnlPercent / 100) * leverage)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={sharedStyles.separator} />
    </View>
  );
}


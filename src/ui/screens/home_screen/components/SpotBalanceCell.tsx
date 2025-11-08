import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';
import type { SpotBalance } from '../../../../types';
import { getDisplayTicker } from '../../../../lib/formatting';

interface SpotBalanceCellProps {
  balance: SpotBalance;
  price: string | undefined;
  total: number;
  usdValue: number;
  assetContext?: any;
  displayName: string;
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

export default function SpotBalanceCell({
  balance,
  price,
  total,
  usdValue,
  assetContext,
  displayName,
  onPress,
}: SpotBalanceCellProps): React.JSX.Element {
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
          <Text style={[sharedStyles.pnl, { color: Color.FG_3 }]}>
            {total.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{' '}
            {getDisplayTicker(balance.coin)}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={sharedStyles.separator} />
    </View>
  );
}


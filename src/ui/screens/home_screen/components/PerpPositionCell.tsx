import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';
import { positionCellStyles } from '../styles/PositionCell.styles';
import { getHip3DisplayName } from '../../../../lib/formatting';
import { Sparkline } from '../../../shared/components';
import { MarqueeView } from '../../../shared/components/marquee';
import { useLiveSparklineData } from '../../../../hooks';
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

function PerpPositionCellComponent({
  position,
  price,
  marginUsed,
  pnl,
  assetContext,
  onPress,
}: PerpPositionCellProps): React.JSX.Element {
  // Get sparkline coin key (HIP-3 positions use dex:coin format)
  const sparklineCoin = position.dex ? `${position.dex}:${position.coin}` : position.coin;
  // Price key for WebSocket lookup (same format)
  const priceKey = sparklineCoin;
  // Get live sparkline data (historical + current price)
  const sparklineData = useLiveSparklineData(sparklineCoin, 'perp', priceKey);

  const positionSize = parseFloat(position.szi);
  const isLong = positionSize > 0;
  const leverage = position.leverage?.value || 1;
  const parsedPrice = price ? parseFloat(price) : 0;

  // Calculate 24h change
  const prevDayPx = assetContext?.prevDayPx || parsedPrice;
  const priceChange = parsedPrice - prevDayPx;
  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;

  // Get display name with collateral for HIP-3 positions
  const displayName = getHip3DisplayName(position.coin, position.dex || '');

  return (
    <View style={positionCellStyles.cellWrapper}>
      <TouchableOpacity style={sharedStyles.positionCell} onPress={onPress}>
        <View style={sharedStyles.leftSide}>
          <View style={sharedStyles.tickerContainer}>
            <MarqueeView>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={sharedStyles.ticker}>{displayName}</Text>
                <Text
                  style={[
                    sharedStyles.leverage,
                    { color: isLong ? Color.BRIGHT_ACCENT : Color.RED },
                  ]}
                >
                  {leverage}x
                </Text>
              </View>
            </MarqueeView>
          </View>
          <View style={sharedStyles.priceContainer}>
            <Text style={sharedStyles.size}>
              {formatNumber(Math.abs(positionSize))} {position.coin}
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
      {sparklineData && sparklineData.points.length > 0 && (
        <View style={positionCellStyles.sparklineOverlay} pointerEvents="none">
          <Sparkline
            data={sparklineData.points}
            isPositive={priceChangePct >= 0}
            fillContainer
          />
        </View>
      )}
      <View style={sharedStyles.separator} />
    </View>
  );
}

export default React.memo(PerpPositionCellComponent);


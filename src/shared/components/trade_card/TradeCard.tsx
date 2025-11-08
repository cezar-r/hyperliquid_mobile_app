import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/TradeCard.styles';
import type { UserFill } from '../../../types';

interface TradeCardProps {
  fill: UserFill;
  displayCoin: string;
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

// Helper to format dollar amounts (PnL) with commas and 2 decimals
function formatDollarAmount(amount: string): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) {
    return '0.00';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TradeCard({ fill, displayCoin }: TradeCardProps): React.JSX.Element {
  return (
    <View>
      <View style={styles.tradeCard}>
        <View style={styles.tradeLeftSide}>
          <View style={styles.tradeTopRow}>
            <Text style={styles.tradeCoin}>{displayCoin}</Text>
            <Text
              style={[styles.tradeSide, fill.side === 'B' ? styles.sideBuy : styles.sideSell]}
            >
              {fill.side === 'B' ? 'BUY' : 'SELL'}
            </Text>
            {fill.closedPnl && parseFloat(fill.closedPnl) !== 0 && (
              <Text
                style={[
                  styles.tradePnl,
                  parseFloat(fill.closedPnl) >= 0 ? styles.pnlPositive : styles.pnlNegative,
                ]}
              >
                {parseFloat(fill.closedPnl) >= 0 ? '+' : ''}${formatDollarAmount(fill.closedPnl)}
              </Text>
            )}
          </View>
          {fill.time && (
            <Text style={styles.tradeTime}>
              {new Date(fill.time).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
        <View style={styles.tradeRightSide}>
          <Text style={styles.tradePrice}>${formatPrice(parseFloat(fill.px))}</Text>
          <Text style={styles.tradeSize}>
            {parseFloat(fill.sz).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 5,
            })}
          </Text>
        </View>
      </View>
      <View style={styles.cellSeparator} />
    </View>
  );
}



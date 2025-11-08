import React from 'react';
import { Text } from 'react-native';
import { styles } from '../styles/BalancePnL.styles';

interface BalancePnLProps {
  pnl: number;
  timeFilter: string;
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 2): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export default function BalancePnL({ pnl, timeFilter }: BalancePnLProps): React.JSX.Element {
  return (
    <Text style={[styles.portfolioPnL, pnl >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
      {pnl >= 0 ? '+' : ''}${formatNumber(pnl, 2)} {timeFilter}
    </Text>
  );
}


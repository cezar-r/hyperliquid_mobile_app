import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles/BalancePnL.styles';
import { Color } from '../../../shared/styles';

interface BalancePnLProps {
  pnl: number;
  timeFilter: string;
  isLoading?: boolean;
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

export default function BalancePnL({ pnl, timeFilter, isLoading = false }: BalancePnLProps): React.JSX.Element {
  if (isLoading) {
    return (
      <ActivityIndicator size="small" color={Color.FG_3} style={{ marginTop: 8 }} />
    );
  }

  return (
    <Text style={[styles.portfolioPnL, pnl >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
      {pnl >= 0 ? '+' : ''}${formatNumber(pnl, 2)} {timeFilter}
    </Text>
  );
}


import React from 'react';
import { Animated, Text } from 'react-native';
import { styles } from '../styles/BalanceAmount.styles';

interface BalanceAmountProps {
  amount: number;
  textColor: Animated.AnimatedInterpolation<string | number>;
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

export default function BalanceAmount({
  amount,
  textColor,
}: BalanceAmountProps): React.JSX.Element {
  return (
    <Animated.Text style={[styles.portfolioValue, { color: textColor }]}>
      ${formatNumber(amount, 2)}
    </Animated.Text>
  );
}


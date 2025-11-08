import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from '../styles/BalanceContent.styles';

interface BalanceContentProps {
  balance: number;
  showDepositButton: boolean;
  onDepositPress: () => void;
  textColor: Animated.AnimatedInterpolation<string | number>;
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

export default function BalanceContent({
  balance,
  showDepositButton,
  onDepositPress,
  textColor,
}: BalanceContentProps): React.JSX.Element {
  return (
    <View style={styles.balanceContainer}>
      <Animated.Text style={[styles.balanceAmount, { color: textColor }]}>
        ${formatNumber(balance, 2)}
      </Animated.Text>
      {showDepositButton && (
        <TouchableOpacity style={styles.depositTextButton} onPress={onDepositPress}>
          <Text style={styles.depositButtonText}>Deposit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


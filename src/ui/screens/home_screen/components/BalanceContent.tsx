import React from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { styles } from '../styles/BalanceContent.styles';
import { Color } from '../../../shared/styles';

interface BalanceContentProps {
  balance: number;
  showDepositButton: boolean;
  onDepositPress: () => void;
  textColor: Animated.AnimatedInterpolation<string | number>;
  pnl24h?: number;
  showPnL?: boolean;
  isLoadingPnL?: boolean;
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
  pnl24h = 0,
  showPnL = false,
  isLoadingPnL = false,
}: BalanceContentProps): React.JSX.Element {
  return (
    <View style={styles.balanceContainer}>
      <Animated.Text style={[styles.balanceAmount, { color: textColor }]}>
        ${formatNumber(balance, 2)}
      </Animated.Text>
      
      {/* 24h PnL Display */}
      {showPnL && (
        <>
          {isLoadingPnL ? (
            <ActivityIndicator size="small" color={Color.FG_3} style={{ marginTop: 8 }} />
          ) : (
            <Text style={[styles.pnlText, pnl24h >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
              {pnl24h >= 0 ? '+' : ''}${formatNumber(pnl24h, 2)} 24h
            </Text>
          )}
        </>
      )}
      
      {showDepositButton && (
        <TouchableOpacity style={styles.depositTextButton} onPress={onDepositPress}>
          <Text style={styles.depositButtonText}>Deposit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/AvailableContainer.styles';

interface AvailableContainerProps {
  label: string;
  amount: string;
  variant?: 'accent' | 'normal';
}

export const AvailableContainer: React.FC<AvailableContainerProps> = ({
  label,
  amount,
  variant = 'accent',
}) => {
  return (
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>{label}</Text>
      <Text style={[
        styles.balanceValue,
        variant === 'normal' && styles.balanceValueNormal
      ]}>
        {amount}
      </Text>
    </View>
  );
};


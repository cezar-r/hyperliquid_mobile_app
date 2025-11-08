import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/DepositButton.styles';

interface DepositButtonProps {
  onPress: () => void;
  disabled?: boolean;
  text?: string;
}

export const DepositButton: React.FC<DepositButtonProps> = ({ 
  onPress, 
  disabled = false,
  text = 'Deposit to Hyperliquid'
}) => {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};


import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { styles } from './styles/SubmitButton.styles';
import Color from '../../../../shared/styles/colors';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  side: 'buy' | 'sell';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  label,
  onPress,
  disabled,
  isSubmitting,
  side,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        side === 'buy' ? styles.buttonBuy : styles.buttonSell,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {isSubmitting ? (
        <ActivityIndicator color={Color.FG_1} />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};


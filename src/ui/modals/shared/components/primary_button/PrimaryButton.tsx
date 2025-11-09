import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/PrimaryButton.styles';
import { playPrimaryButtonHaptic } from '../../../../../lib/haptics';

interface PrimaryButtonProps {
  onPress: () => void;
  disabled?: boolean;
  text: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  onPress, 
  disabled = false,
  text
}) => {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
      onPress={() => {
        playPrimaryButtonHaptic();
        onPress();
      }}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};


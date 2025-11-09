import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/ActionButtons.styles';
import { playPrimaryButtonHaptic, playCancelHaptic } from '../../../../../lib/haptics';

interface ActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText: string;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => {
        playCancelHaptic();
        onCancel();
      }}>
        <Text style={styles.secondaryButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.primaryButtonFlex,
          variant === 'danger' && styles.dangerButtonFlex,
          disabled && styles.buttonDisabled
        ]}
        onPress={() => {
          playPrimaryButtonHaptic();
          onConfirm();
        }}
        disabled={disabled}
      >
        <Text style={styles.primaryButtonText}>{confirmText}</Text>
      </TouchableOpacity>
    </View>
  );
};


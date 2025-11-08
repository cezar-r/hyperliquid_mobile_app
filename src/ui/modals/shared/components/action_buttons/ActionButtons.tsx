import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/ActionButtons.styles';

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
      <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
        <Text style={styles.secondaryButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.primaryButtonFlex,
          variant === 'danger' && styles.dangerButtonFlex,
          disabled && styles.buttonDisabled
        ]}
        onPress={onConfirm}
        disabled={disabled}
      >
        <Text style={styles.primaryButtonText}>{confirmText}</Text>
      </TouchableOpacity>
    </View>
  );
};


import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/ActionButtons.styles';

interface ActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText,
}) => {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
        <Text style={styles.secondaryButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryButtonFlex} onPress={onConfirm}>
        <Text style={styles.primaryButtonText}>{confirmText}</Text>
      </TouchableOpacity>
    </View>
  );
};


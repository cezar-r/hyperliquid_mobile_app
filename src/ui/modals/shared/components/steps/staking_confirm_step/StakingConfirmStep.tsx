import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/StakingConfirmStep.styles';

export interface StakingConfirmDetail {
  label: string;
  value: string;
}

interface StakingConfirmStepProps {
  details: StakingConfirmDetail[];
  warningText: string;
  onBack: () => void;
  onConfirm: () => void;
  confirmText: string;
  variant?: 'primary' | 'danger';
}

export const StakingConfirmStep: React.FC<StakingConfirmStepProps> = ({
  details,
  warningText,
  onBack,
  onConfirm,
  confirmText,
  variant = 'primary',
}) => {
  return (
    <>
      <View style={styles.confirmSection}>
        {details.map((detail, index) => (
          <View key={index} style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>{detail.label}</Text>
            <Text style={styles.confirmValue}>{detail.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>{warningText}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            variant === 'danger' && styles.confirmButtonDanger
          ]} 
          onPress={onConfirm}
        >
          <Text style={styles.confirmButtonText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};


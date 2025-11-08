import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/ErrorStep.styles';
import { ActionButtons } from '../../action_buttons/ActionButtons';

interface ErrorStepProps {
  title: string;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export const ErrorStep: React.FC<ErrorStepProps> = ({
  title,
  error,
  onClose,
  onRetry,
}) => {
  return (
    <View style={styles.errorStep}>
      <View style={styles.errorIcon}>
        <Text style={styles.errorIconText}>✕</Text>
      </View>
      <Text style={styles.errorTitle}>{title}</Text>
      {error && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <ActionButtons
        onCancel={onClose}
        onConfirm={onRetry}
        cancelText="Close"
        confirmText="Try Again"
      />
    </View>
  );
};


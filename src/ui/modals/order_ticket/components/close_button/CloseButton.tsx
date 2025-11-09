import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/CloseButton.styles';

interface CloseButtonProps {
  onPress: () => void;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.closeButton}>
      <Text style={styles.closeButtonText}>×</Text>
    </TouchableOpacity>
  );
};


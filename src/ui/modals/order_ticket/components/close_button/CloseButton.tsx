import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/CloseButton.styles';
import { playCancelHaptic } from '../../../../../lib/haptics';

interface CloseButtonProps {
  onPress: () => void;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={() => {
      playCancelHaptic();
      onPress();
    }} style={styles.closeButton}>
      <Text style={styles.closeButtonText}>×</Text>
    </TouchableOpacity>
  );
};


import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/ModalHeader.styles';
import { playCancelHaptic } from '../../../../../lib/haptics';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <TouchableOpacity onPress={() => {
        playCancelHaptic();
        onClose();
      }} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};


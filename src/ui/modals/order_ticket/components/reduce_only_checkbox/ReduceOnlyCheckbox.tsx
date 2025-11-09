import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/ReduceOnlyCheckbox.styles';
import Color from '../../../../shared/styles/colors';

interface ReduceOnlyCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

export const ReduceOnlyCheckbox: React.FC<ReduceOnlyCheckboxProps> = ({ checked, onToggle }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={{ color: Color.FG_1, fontSize: 14 }}>✓</Text>}
      </View>
      <Text style={styles.label}>Reduce Only</Text>
    </TouchableOpacity>
  );
};


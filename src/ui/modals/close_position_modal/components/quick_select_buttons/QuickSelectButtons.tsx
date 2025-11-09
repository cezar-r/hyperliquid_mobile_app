import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/QuickSelectButtons.styles';

interface QuickSelectButtonsProps {
  selectedValue: number;
  onSelect: (value: number) => void;
  values?: number[];
}

export const QuickSelectButtons: React.FC<QuickSelectButtonsProps> = ({ 
  selectedValue, 
  onSelect,
  values = [25, 50, 75, 100],
}) => {
  return (
    <View style={styles.quickSelectContainer}>
      {values.map((value) => (
        <TouchableOpacity
          key={value}
          style={[
            styles.quickSelectButton,
            selectedValue === value && styles.quickSelectButtonActive,
          ]}
          onPress={() => onSelect(value)}
        >
          <Text
            style={[
              styles.quickSelectButtonText,
              selectedValue === value && styles.quickSelectButtonTextActive,
            ]}
          >
            {value}%
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


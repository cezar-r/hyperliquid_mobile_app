import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/MarketDropdownOption.styles';

interface MarketDropdownOptionProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export default function MarketDropdownOption({
  label,
  isSelected,
  onPress,
}: MarketDropdownOptionProps): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.marketDropdownItem} onPress={onPress}>
      <Text
        style={[
          styles.marketDropdownItemText,
          isSelected && styles.marketDropdownItemTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}


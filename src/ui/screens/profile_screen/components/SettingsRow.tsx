import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/SettingsRow.styles';

interface SettingsRowProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export default function SettingsRow({
  label,
  value,
  onToggle,
}: SettingsRowProps): React.JSX.Element {
  return (
    <TouchableOpacity 
      style={styles.settingsRow}
      onPress={() => onToggle(!value)}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={[
        styles.customCheckbox,
        value && styles.customCheckboxChecked
      ]} />
    </TouchableOpacity>
  );
}


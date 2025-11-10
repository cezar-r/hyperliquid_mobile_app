import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/SettingsRow.styles';

interface SettingsNavigationRowProps {
  onPress: () => void;
}

export default function SettingsNavigationRow({
  onPress,
}: SettingsNavigationRowProps): React.JSX.Element {
  return (
    <TouchableOpacity 
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsLabel}>Settings</Text>
      <View style={styles.arrowIcon}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}


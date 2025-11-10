import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/SettingsRow.styles';

interface PortfolioNavigationRowProps {
  onPress: () => void;
}

export default function PortfolioNavigationRow({
  onPress,
}: PortfolioNavigationRowProps): React.JSX.Element {
  return (
    <TouchableOpacity 
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsLabel}>Portfolio</Text>
      <View style={styles.arrowIcon}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}


import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/EquityRow.styles';

interface EquityRowProps {
  label: string;
  value: string;
}

export default function EquityRow({ label, value }: EquityRowProps): React.JSX.Element {
  return (
    <View style={styles.equityRow}>
      <Text style={styles.equityLabel}>{label}</Text>
      <Text style={styles.equityValue}>{value}</Text>
    </View>
  );
}


import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/TradingVolumeDisplay.styles';

interface TradingVolumeDisplayProps {
  volume: number;
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 2): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export default function TradingVolumeDisplay({
  volume,
}: TradingVolumeDisplayProps): React.JSX.Element {
  return (
    <View style={styles.volumeContainer}>
      <Text style={styles.volumeLabel}>Trading Volume</Text>
      <Text style={styles.volumeValue}>${formatNumber(volume, 2)}</Text>
    </View>
  );
}


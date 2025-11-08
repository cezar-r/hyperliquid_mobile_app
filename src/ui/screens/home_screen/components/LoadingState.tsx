import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/LoadingState.styles';

export default function LoadingState(): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
      <Text style={styles.loadingText}>Loading account data...</Text>
    </View>
  );
}


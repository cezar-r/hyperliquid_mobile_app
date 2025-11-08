import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/ErrorState.styles';

interface ErrorStateProps {
  error: string;
}

export default function ErrorState({ error }: ErrorStateProps): React.JSX.Element {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>⚠️ {error}</Text>
    </View>
  );
}


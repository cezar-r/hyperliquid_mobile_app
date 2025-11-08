import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/EmptyState.styles';

interface EmptyStateProps {
  message: string;
  submessage: string;
}

export default function EmptyState({
  message,
  submessage,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{submessage}</Text>
    </View>
  );
}


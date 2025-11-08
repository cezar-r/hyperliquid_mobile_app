import React from 'react';
import { View, Text } from 'react-native';
import { LoadingBlob } from '../../../shared/components';
import { styles } from '../styles/LoadingState.styles';

interface LoadingStateProps {
  message: string;
}

export default function LoadingState({ message }: LoadingStateProps): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <LoadingBlob />
      {/* <Text style={styles.loadingText}>{message}</Text> */}
    </View>
  );
}


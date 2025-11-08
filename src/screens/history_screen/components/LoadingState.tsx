import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles/LoadingState.styles';

interface LoadingStateProps {
  message: string;
}

export default function LoadingState({ message }: LoadingStateProps): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <Image source={require('../../../../assets/blob_green.gif')} style={styles.loadingGif} />
      {/* <Text style={styles.loadingText}>{message}</Text> */}
    </View>
  );
}


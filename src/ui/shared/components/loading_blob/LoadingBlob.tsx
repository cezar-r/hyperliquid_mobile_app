import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LoadingBlobProps {
  size?: number;
}

export default function LoadingBlob({ size = 100 }: LoadingBlobProps): React.JSX.Element {
  return (
    <Image
      source={require('../../../../../assets/blob_green.gif')}
      style={[styles.loadingGif, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  loadingGif: {
    width: 100,
    height: 100,
  },
});


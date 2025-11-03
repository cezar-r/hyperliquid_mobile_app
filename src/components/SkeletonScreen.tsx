import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';

export default function SkeletonScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  content: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
});


import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { styles } from './styles/SkeletonScreen.styles';

export default function SkeletonScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} />
    </SafeAreaView>
  );
}


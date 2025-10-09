import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from './styles/HomeScreen.styles';

export default function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>
          Your portfolio overview will appear here
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Account balances
          </Text>
          <Text style={styles.placeholderText}>
            • Open positions
          </Text>
          <Text style={styles.placeholderText}>
            • Recent activity
          </Text>
          <Text style={styles.placeholderText}>
            • PnL summary
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from './styles/HistoryScreen.styles';

export default function HistoryScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          Your trade history and activity
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Recent fills
          </Text>
          <Text style={styles.placeholderText}>
            • Order history
          </Text>
          <Text style={styles.placeholderText}>
            • Deposits & withdrawals
          </Text>
          <Text style={styles.placeholderText}>
            • Filter by market/type
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from './styles/ChartScreen.styles';

export default function ChartScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Chart</Text>
        <Text style={styles.subtitle}>
          OHLC candlestick charts will appear here
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Historical price data
          </Text>
          <Text style={styles.placeholderText}>
            • Multiple timeframes (1m, 5m, 1h, 1d)
          </Text>
          <Text style={styles.placeholderText}>
            • Real-time candle updates
          </Text>
          <Text style={styles.placeholderText}>
            • Ticker selector
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from './styles/SearchScreen.styles';

export default function SearchScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>
          Search markets and place orders
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Market search & selection
          </Text>
          <Text style={styles.placeholderText}>
            • Perp/Spot toggle
          </Text>
          <Text style={styles.placeholderText}>
            • Order entry (limit/market)
          </Text>
          <Text style={styles.placeholderText}>
            • Orderbook display
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


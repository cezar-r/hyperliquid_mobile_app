import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/ConnectScreen.styles';

interface ConnectScreenProps {
  onConnect: () => void;
}

export default function ConnectScreen({
  onConnect,
}: ConnectScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Hyperliquid Mobile</Text>
        <Text style={styles.subtitle}>
          Connect your wallet to access the Hyperliquid exchange
        </Text>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={onConnect}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Testnet Mode</Text>
      </View>
    </View>
  );
}


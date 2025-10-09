import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { isTestnet } from '../lib/config';
import { styles } from './styles/ProfileScreen.styles';

export default function ProfileScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { disconnect } = useAppKit();

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
          },
        },
      ]
    );
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Account settings and preferences
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <Text style={styles.infoText}>
            {formatAddress(address)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <Text style={styles.infoText}>
            {isTestnet() ? 'Testnet' : 'Mainnet'}
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Auto-approve status (coming soon)
          </Text>
          <Text style={styles.placeholderText}>
            • Preferences (coming soon)
          </Text>
          <Text style={styles.placeholderText}>
            • About & support (coming soon)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
          activeOpacity={0.8}
        >
          <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


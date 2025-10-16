import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import * as Clipboard from 'expo-clipboard';
import { Octicons } from '@expo/vector-icons';
import { styles } from './styles/ProfileScreen.styles';
import Color from '../styles/colors';

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

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.section}>
            <View style={styles.walletInfoRow}>
              <Text style={styles.infoText}>
                {formatAddress(address)}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAddress}
                activeOpacity={0.7}
              >
                <Octicons name="copy" size={16} color={Color.BRIGHT_ACCENT} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


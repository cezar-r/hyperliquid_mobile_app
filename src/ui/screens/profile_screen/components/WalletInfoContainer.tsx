import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Octicons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/WalletInfoContainer.styles';

interface WalletInfoContainerProps {
  address: string | undefined;
}

export default function WalletInfoContainer({
  address,
}: WalletInfoContainerProps): React.JSX.Element {
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  };

  return (
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
  );
}


import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { styles } from './styles/ConnectScreen.styles';
import { isTestnet } from '../lib/config';

type NavigationProp = NativeStackNavigationProp<any>;

export default function ConnectScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      console.log('[ConnectScreen] Connected:', address);
      navigation.navigate('EnableSessionKey');
    }
  }, [isConnected, address, navigation]);

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('[ConnectScreen] Failed to open modal:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Hyperliquid Mobile</Text>
        <Text style={styles.subtitle}>
          Connect your wallet to access the Hyperliquid exchange
        </Text>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          {isTestnet() ? 'Testnet Mode' : 'Mainnet Mode'}
        </Text>
      </View>
    </View>
  );
}


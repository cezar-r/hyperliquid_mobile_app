import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { styles } from './styles/ConnectScreen.styles';
import { loadSessionKey } from '../../../lib/sessionKey';
import { VideoBackground } from './components';

type NavigationProp = NativeStackNavigationProp<any>;

export default function ConnectScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const checkSessionAndNavigate = async () => {
      if (isConnected && address) {
        console.log('[ConnectScreen] Connected:', address);
        
        // Check if user already has a valid session key
        const existingSessionKey = await loadSessionKey();
        
        if (existingSessionKey) {
          console.log('[ConnectScreen] Found existing session key, skipping setup screen');
          navigation.navigate('Authenticated', { screen: 'Tabs' });
        } else {
          console.log('[ConnectScreen] No session key found, showing setup screen');
          navigation.navigate('EnableSessionKey');
        }
      }
    };

    checkSessionAndNavigate();
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
      <VideoBackground />
      <View style={styles.content}>
        <Text style={styles.title}>Hyperliquid</Text>
        
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


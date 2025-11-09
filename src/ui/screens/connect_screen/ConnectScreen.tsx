import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { logScreenMount, logScreenUnmount, logUserAction } from '../../../lib/logger';
import { styles } from './styles/ConnectScreen.styles';
import { VideoBackground } from './components';

type NavigationProp = NativeStackNavigationProp<any>;

export default function ConnectScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const hasNavigated = useRef(false);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('ConnectScreen');
    return () => logScreenUnmount('ConnectScreen');
  }, []);

  // When user connects wallet on this screen, navigate back to Splash
  // Splash will handle routing to the correct screen (EnableSessionKey or Home)
  useEffect(() => {
    if (isConnected && address && !hasNavigated.current) {
      logUserAction('ConnectScreen', 'Wallet connected', address);
      hasNavigated.current = true;
      // Navigate to Splash which will handle the routing logic
      navigation.replace('Splash');
    }
  }, [isConnected, address, navigation]);

  const handleConnect = async () => {
    logUserAction('ConnectScreen', 'Connect wallet button pressed');
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


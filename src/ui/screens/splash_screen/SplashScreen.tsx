import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LoadingBlob } from '../../shared/components';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccount } from '@reown/appkit-react-native';
import { loadSessionKey } from '../../../lib/sessionKey';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { styles } from './styles/SplashScreen.styles';

type NavigationProp = NativeStackNavigationProp<any>;

export default function SplashScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { address, isConnected } = useAccount();
  const { account } = useWallet();
  const { state: wsState } = useWebSocket();
  const hasNavigated = useRef(false);
  const startTime = useRef(Date.now());
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Wait a full second to let the wallet connection state fully initialize
    checkTimeout.current = setTimeout(async () => {
      if (hasNavigated.current) return;

      console.log('[SplashScreen] Connection check - isConnected:', isConnected, 'address:', address);

      // Ensure minimum 1 second display time
      const elapsed = Date.now() - startTime.current;
      const minDisplayTime = 1000;
      const additionalWait = Math.max(0, minDisplayTime - elapsed);

      if (additionalWait > 0) {
        await new Promise(resolve => setTimeout(resolve, additionalWait));
      }

      if (hasNavigated.current) return;

      // NOT CONNECTED - go to Connect screen
      if (!isConnected || !address) {
        console.log('[SplashScreen] Not connected, navigating to Connect');
        hasNavigated.current = true;
        navigation.replace('Connect');
        return;
      }

      // CONNECTED - check for session key
      try {
        const sessionKey = await loadSessionKey();
        
        if (!sessionKey) {
          // Connected but no session key - go to EnableSessionKey
          console.log('[SplashScreen] Connected but no session key, navigating to EnableSessionKey');
          hasNavigated.current = true;
          navigation.replace('EnableSessionKey');
          return;
        }

        // HAS SESSION KEY - wait for account and market data before going to home
        console.log('[SplashScreen] Has session key, waiting for account and market data...');
        
        // Wait for both account and market data to load (up to 5 seconds)
        const maxWaitForData = 5000;
        const dataStartTime = Date.now();
        
        const checkAllData = () => {
          if (hasNavigated.current) return;
          
          const waitedForData = Date.now() - dataStartTime;
          
          // Check if we have all required data
          const hasAccountData = account.data !== null;
          const hasMarketData = wsState.perpMarkets.length > 0 && wsState.spotMarkets.length > 0;
          const isWebSocketConnected = wsState.isConnected;
          
          console.log('[SplashScreen] Data check:', {
            hasAccountData,
            hasMarketData,
            isWebSocketConnected,
            perpMarkets: wsState.perpMarkets.length,
            spotMarkets: wsState.spotMarkets.length,
            waitedMs: waitedForData
          });
          
          // Navigate if we have all data OR we've waited too long
          if ((hasAccountData && hasMarketData && isWebSocketConnected) || waitedForData > maxWaitForData) {
            console.log('[SplashScreen] All data ready, navigating to home');
            hasNavigated.current = true;
            navigation.replace('Authenticated', { screen: 'Tabs' });
          } else {
            // Check again in 200ms
            setTimeout(checkAllData, 200);
          }
        };
        
        checkAllData();
        
      } catch (error) {
        console.error('[SplashScreen] Error checking session key:', error);
        hasNavigated.current = true;
        navigation.replace('Connect');
      }
    }, 1000); // Wait 1 full second before checking anything

    return () => {
      if (checkTimeout.current) {
        clearTimeout(checkTimeout.current);
      }
    };
  }, [isConnected, address, account.data, wsState.perpMarkets.length, wsState.spotMarkets.length, wsState.isConnected, navigation]);

  return (
    <View style={styles.container}>
      <LoadingBlob size={80} />
    </View>
  );
}


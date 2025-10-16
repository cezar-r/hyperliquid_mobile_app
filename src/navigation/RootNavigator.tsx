import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { loadSessionKey } from '../lib/sessionKey';
import ConnectScreen from '../screens/ConnectScreen';
import EnableSessionKeyScreen from '../screens/EnableSessionKeyScreen';
import ChartScreen from '../screens/ChartScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { address, isConnected } = useAccount();
  const { provider } = useProvider();
  const { setupClients, clearClients } = useWallet();

  useEffect(() => {
    if (!isConnected) {
      clearClients();
      navigation.reset({ index: 0, routes: [{ name: 'Connect' }] });
    }
  }, [isConnected, navigation, clearClients]);

  useEffect(() => {
    const initializeClients = async () => {
      if (isConnected && address && provider) {
        console.log('[RootNavigator] Setting up Hyperliquid clients...');
        try {
          const existingSessionKey = await loadSessionKey();
          await setupClients(address, provider, existingSessionKey);
          console.log('[RootNavigator] ✓ Clients initialized');
        } catch (error) {
          console.error('[RootNavigator] Failed to setup clients:', error);
        }
      }
    };

    initializeClients();
  }, [isConnected, address, provider, setupClients]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Connect" component={ConnectScreen} />
      <Stack.Screen
        name="EnableSessionKey"
        component={EnableSessionKeyScreen}
      />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen 
        name="ChartDetail" 
        component={ChartScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


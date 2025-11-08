import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { loadSessionKey } from '../lib/sessionKey';
import SplashScreen from '../screens/splash_screen/SplashScreen';
import ConnectScreen from '../screens/connect_screen/ConnectScreen';
import EnableSessionKeyScreen from '../screens/enable_session_key_screen/EnableSessionKeyScreen';
import ChartScreen from '../screens/chart_screen/ChartScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

// Wrapper component for authenticated screens that need WebSocket
function AuthenticatedScreens(): React.JSX.Element {
  return (
    <WebSocketProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="Tabs" 
          component={TabNavigator}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen 
          name="ChartDetail" 
          component={ChartScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </WebSocketProvider>
  );
}

export default function RootNavigator(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { address, isConnected } = useAccount();
  const { provider } = useProvider();
  const { setupClients, clearClients } = useWallet();
  const initializedAddressRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      clearClients();
      initializedAddressRef.current = null;
      navigation.reset({ index: 0, routes: [{ name: 'Connect' }] });
    }
  }, [isConnected, navigation, clearClients]);

  useEffect(() => {
    const initializeClients = async () => {
      if (isConnected && address && provider) {
        // Prevent duplicate initialization for the same address
        if (initializedAddressRef.current === address) {
          console.log('[RootNavigator] Clients already initialized for:', address);
          return;
        }

        console.log('[RootNavigator] Setting up Hyperliquid clients...');
        try {
          const existingSessionKey = await loadSessionKey();
          await setupClients(address, provider, existingSessionKey);
          initializedAddressRef.current = address;
          console.log('[RootNavigator] ✓ Clients initialized');
        } catch (error) {
          console.error('[RootNavigator] Failed to setup clients:', error);
        }
      }
    };

    initializeClients();
  }, [isConnected, address, provider]);

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Connect" component={ConnectScreen} />
      <Stack.Screen
        name="EnableSessionKey"
        component={EnableSessionKeyScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="Authenticated" 
        component={AuthenticatedScreens}
        options={{ gestureEnabled: false, headerShown: false }}
      />
    </Stack.Navigator>
  );
}


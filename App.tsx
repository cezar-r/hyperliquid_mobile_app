import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import Color from './src/styles/colors';
import RootNavigator from './src/navigation/RootNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { appKit } from './src/lib/appKitConfig';

SplashScreen.preventAutoHideAsync();

export default function App(): React.JSX.Element {
  const [appKitReady, setAppKitReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Teodor': require('./assets/fonts/Teodor.otf'),
    'TeodorMed': require('./assets/fonts/TeodorMed.otf'),
    'TeodorThin': require('./assets/fonts/TeodorThin.otf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('❌ Error loading fonts:', fontError);
    }
    
    if (fontsLoaded) {
      console.log('✅ Fonts loaded successfully!');
      console.log('Font names available: Teodor, TeodorMed, TeodorThin');
    }
    
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Ensure <AppKit /> mounts before rendering components that use its hooks
  useEffect(() => {
    setAppKitReady(true);
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appKit}>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.appKitWrapper}>
            <AppKit />
          </View>
          {appKitReady && (
            <NavigationContainer>
              <WalletProvider>
                <RootNavigator />
              </WalletProvider>
            </NavigationContainer>
          )}
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </AppKitProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appKitWrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Color.BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

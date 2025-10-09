import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Color from './src/styles/colors';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App(): React.JSX.Element {
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

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <RootNavigator />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Color.BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

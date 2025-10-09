import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Color from './src/styles/colors';

SplashScreen.preventAutoHideAsync();

export default function App(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    'Teodor': require('./assets/fonts/Teodor.otf'),
    'TeodorMed': require('./assets/fonts/TeodorMed.otf'),
    'TeodorThin': require('./assets/fonts/TeodorThin.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hyperliquid Mobile Companion</Text>
      <Text style={styles.subtitle}>Phase 0: Bootstrap Complete</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'TeodorMed',
    fontSize: 24,
    color: Color.FG_1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Teodor',
    fontSize: 16,
    color: Color.FG_3,
  },
});

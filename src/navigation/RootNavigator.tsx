import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '@reown/appkit-react-native';
import ConnectScreen from '../screens/ConnectScreen';
import EnableSessionKeyScreen from '../screens/EnableSessionKeyScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      navigation.reset({ index: 0, routes: [{ name: 'Connect' }] });
    }
  }, [isConnected, navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Connect" component={ConnectScreen} />
      <Stack.Screen
        name="EnableSessionKey"
        component={EnableSessionKeyScreen}
      />
      <Stack.Screen name="Tabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}


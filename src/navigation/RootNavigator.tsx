import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import ConnectScreen from '../screens/ConnectScreen';
import TabNavigator from './TabNavigator';

export default function RootNavigator(): React.JSX.Element {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <NavigationContainer>
      {isConnected ? (
        <TabNavigator onDisconnect={handleDisconnect} />
      ) : (
        <ConnectScreen onConnect={handleConnect} />
      )}
    </NavigationContainer>
  );
}


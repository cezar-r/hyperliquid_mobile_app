import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, SafeAreaView, InteractionManager } from 'react-native';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { styles } from './styles/ProfileScreen.styles';
import SkeletonScreen from '../../components/SkeletonScreen';
import WalletInfoContainer from './components/WalletInfoContainer';
import SettingsContainer from './components/SettingsContainer';
import DisconnectButton from './components/DisconnectButton';

export default function ProfileScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { disconnect } = useAppKit();
  
  // For skeleton loading
  const [isReady, setIsReady] = useState(false);

  // Defer rendering until navigation is complete
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
          },
        },
      ]
    );
  };

  if (!isReady) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <WalletInfoContainer address={address} />
        
        <SettingsContainer />
      </ScrollView>

      <DisconnectButton onPress={handleDisconnect} />
    </SafeAreaView>
  );
}


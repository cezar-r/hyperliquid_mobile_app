import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { logScreenMount, logScreenUnmount, logUserAction } from '../../../lib/logger';
import { styles } from './styles/ProfileScreen.styles';
import { SkeletonScreen } from '../../shared/components';
import { WalletInfoContainer, SettingsContainer, DisconnectButton } from './components';

export default function ProfileScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { disconnect } = useAppKit();
  
  // For skeleton loading
  const [isReady] = useState(true);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('ProfileScreen');
    return () => logScreenUnmount('ProfileScreen');
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
            logUserAction('ProfileScreen', 'Disconnect wallet');
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
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
      >
        <WalletInfoContainer address={address} />
        
        <SettingsContainer />
      </ScrollView>

      <DisconnectButton onPress={handleDisconnect} />
    </SafeAreaView>
  );
}


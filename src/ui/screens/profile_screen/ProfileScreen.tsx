import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { useNavigation } from '@react-navigation/native';
import { logScreenMount, logScreenUnmount, logUserAction } from '../../../lib/logger';
import { playPrimaryButtonHaptic } from '../../../lib/haptics';
import { styles } from './styles/ProfileScreen.styles';
import { SkeletonScreen } from '../../shared/components';
import { WalletInfoContainer, SettingsNavigationRow, DisconnectButton } from './components';

export default function ProfileScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { disconnect } = useAppKit();
  const navigation = useNavigation<any>();
  
  // For skeleton loading
  const [isReady] = useState(true);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('ProfileScreen');
    return () => logScreenUnmount('ProfileScreen');
  }, []);

  const handleNavigateToSettings = () => {
    playPrimaryButtonHaptic();
    navigation.navigate('Settings');
  };

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
        
        <SettingsNavigationRow onPress={handleNavigateToSettings} />
      </ScrollView>

      <DisconnectButton onPress={handleDisconnect} />
    </SafeAreaView>
  );
}


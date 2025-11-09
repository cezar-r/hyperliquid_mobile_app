import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../../../../../contexts/WalletContext';
import SettingsRow from '../SettingsRow';
import { styles } from './styles/EnableTradingRow.styles';

export default function EnableTradingRow(): React.JSX.Element {
  const { address } = useAccount();
  const { hasSessionKey, enableSessionKey, disableSessionKey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async (nextValue: boolean) => {
    if (isProcessing) return;

    if (nextValue) {
      if (!address) {
        Alert.alert('Enable Trading', 'No wallet connected.');
        return;
      }
      try {
        setIsProcessing(true);
        await enableSessionKey(address);
      } catch (error: any) {
        Alert.alert('Enable Trading Failed', error?.message || 'Failed to enable trading.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    Alert.alert(
      'Disable Trading',
      'This will clear the session key. You will need to re-enable trading to auto-approve future actions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await disableSessionKey();
            } catch (error: any) {
              Alert.alert('Disable Trading Failed', error?.message || 'Failed to disable trading.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const label = isProcessing ? 'Enable Trading (processing...)' : 'Enable Trading';

  return (
    <SettingsRow
      label={label}
      value={hasSessionKey}
      onToggle={handleToggle}
    />
  );
}



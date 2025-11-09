import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../../../../../contexts/WalletContext';
import SettingsRow from '../SettingsRow';

export default function AutoApproveRow(): React.JSX.Element {
  const { address } = useAccount();
  const { hasSessionKey, enableSessionKey, disableSessionKey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async (nextValue: boolean) => {
    if (isProcessing) return;

    if (nextValue) {
      if (!address) {
        Alert.alert('Auto-Approve', 'No wallet connected.');
        return;
      }
      try {
        setIsProcessing(true);
        await enableSessionKey(address);
      } catch (error: any) {
        Alert.alert('Auto-Approve Failed', error?.message || 'Failed to enable auto-approve.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    Alert.alert(
      'Disable Auto-Approve',
      'This will clear the session key. You will need to re-enable auto-approve to auto-approve future actions.',
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
              Alert.alert('Disable Auto-Approve Failed', error?.message || 'Failed to disable auto-approve.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const label = isProcessing ? 'Enable Auto-Approve (processing...)' : 'Enable Auto-Approve';

  return (
    <SettingsRow
      label={label}
      value={hasSessionKey}
      onToggle={handleToggle}
    />
  );
}



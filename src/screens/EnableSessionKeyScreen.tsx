import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { styles } from './styles/EnableSessionKeyScreen.styles';

type NavigationProp = NativeStackNavigationProp<any>;

export default function EnableSessionKeyScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { enableSessionKey } = useWallet();
  const { address } = useAccount();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    if (!address) {
      setError('No wallet address found');
      return;
    }

    setIsEnabling(true);
    setError(null);

    try {
      console.log('[EnableSessionKey] Enabling session key for:', address);
      await enableSessionKey(address);
      console.log('[EnableSessionKey] ✓ Session key enabled successfully');
      navigation.replace('Authenticated', { screen: 'Tabs' });
    } catch (err: any) {
      console.error('[EnableSessionKey] Failed to enable session key:', err);
      setError(err.message || 'Failed to enable auto-approve. Please try again.');
      setIsEnabling(false);
    }
  };

  const handleSkip = () => {
    console.log('[EnableSessionKey] User skipped session key setup');
    navigation.replace('Authenticated', { screen: 'Tabs' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚡</Text>

        <Text style={styles.title}>Enable Auto-Approve?</Text>

        <Text style={styles.description}>
          Speed up your trading by approving transactions automatically 
          for 7 days. You'll only need to sign once now, instead of 
          for every trade.
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🚀</Text>
            <Text style={styles.benefitText}>
              Place orders instantly without wallet popups
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>
              Secure: session expires after 7 days
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⏱️</Text>
            <Text style={styles.benefitText}>
              Save time on every trade, cancel, and adjustment
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>
              Deposits and withdrawals still require your approval
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.enableButton, isEnabling && styles.enableButtonDisabled]}
            onPress={handleEnable}
            disabled={isEnabling}
          >
            {isEnabling ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.enableButtonText}>
                Enable Auto-Approve
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isEnabling}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


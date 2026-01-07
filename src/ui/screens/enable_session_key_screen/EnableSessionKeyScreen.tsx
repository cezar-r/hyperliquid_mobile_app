import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../../../contexts/WalletContext';
import { styles } from './styles/EnableSessionKeyScreen.styles';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = { autoTrigger?: boolean };

export default function EnableSessionKeyScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ EnableSessionKey: RouteParams }, 'EnableSessionKey'>>();
  const { enableSessionKey } = useWallet();
  const { address } = useAccount();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const autoTrigger = route.params?.autoTrigger ?? false;

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

  // Auto-trigger enable flow if requested (from reconnection with preference set)
  useEffect(() => {
    if (autoTrigger && address && !isEnabling && !autoTriggered.current) {
      console.log('[EnableSessionKey] Auto-triggering session key approval');
      autoTriggered.current = true;
      handleEnable();
    }
  }, [autoTrigger, address]);

  // If auto-triggering, show a simpler loading UI
  if (autoTrigger && isEnabling && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Re-enabling Auto-Approve...</Text>
          <Text style={styles.description}>
            Please approve the signature request in your wallet.
          </Text>
          <View style={{ marginTop: 32 }}>
            <ActivityIndicator size="large" color="#00E676" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enable Auto-Approve?</Text>

        <Text style={styles.description}>
          Speed up your trading by approving transactions automatically 
          for 7 days. You'll only need to sign once now, instead of 
          for every trade.
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>
              • Place orders instantly without wallet popups
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>
              • Secure: session expires after 7 days
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>
              • Save time on every trade, cancel, and adjustment
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>
              • Deposits and withdrawals still require your approval
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
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isEnabling}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enableButton, isEnabling && styles.enableButtonDisabled]}
            onPress={handleEnable}
            disabled={isEnabling}
          >
            {isEnabling ? (
              <ActivityIndicator color="#303030" />
            ) : (
              <Text style={styles.enableButtonText}>
                Enable
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


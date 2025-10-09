import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './styles/EnableSessionKeyScreen.styles';

type NavigationProp = NativeStackNavigationProp<any>;

export default function EnableSessionKeyScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const handleEnable = async () => {
    console.log('[EnableSessionKey] Enable clicked (not yet implemented)');
    navigation.replace('Tabs');
  };

  const handleSkip = () => {
    navigation.replace('Tabs');
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnable}
          >
            <Text style={styles.enableButtonText}>
              Enable Auto-Approve
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


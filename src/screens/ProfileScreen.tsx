import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView, InteractionManager } from 'react-native';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Octicons } from '@expo/vector-icons';
import { styles } from './styles/ProfileScreen.styles';
import Color from '../styles/colors';
import SkeletonScreen from '../components/SkeletonScreen';

const SHOW_TRADES_KEY = '@show_trades_on_chart';
const SKIP_OPEN_ORDER_CONFIRMATIONS_KEY = '@skip_open_order_confirmations';
const SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY = '@skip_close_position_confirmations';

export default function ProfileScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { disconnect } = useAppKit();
  const [showTradesOnChart, setShowTradesOnChart] = useState(false);
  const [skipOpenOrderConfirmations, setSkipOpenOrderConfirmations] = useState(false);
  const [skipClosePositionConfirmations, setSkipClosePositionConfirmations] = useState(false);
  
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

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const showTradesValue = await AsyncStorage.getItem(SHOW_TRADES_KEY);
        if (showTradesValue !== null) {
          setShowTradesOnChart(showTradesValue === 'true');
        }

        const skipOpenOrderValue = await AsyncStorage.getItem(SKIP_OPEN_ORDER_CONFIRMATIONS_KEY);
        if (skipOpenOrderValue !== null) {
          setSkipOpenOrderConfirmations(skipOpenOrderValue === 'true');
        }

        const skipClosePositionValue = await AsyncStorage.getItem(SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY);
        if (skipClosePositionValue !== null) {
          setSkipClosePositionConfirmations(skipClosePositionValue === 'true');
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Handle toggle changes
  const handleToggleShowTrades = async (value: boolean) => {
    setShowTradesOnChart(value);
    try {
      await AsyncStorage.setItem(SHOW_TRADES_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save show trades preference:', error);
    }
  };

  const handleToggleSkipOpenOrderConfirmations = async (value: boolean) => {
    setSkipOpenOrderConfirmations(value);
    try {
      await AsyncStorage.setItem(SKIP_OPEN_ORDER_CONFIRMATIONS_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save skip open order confirmations preference:', error);
    }
  };

  const handleToggleSkipClosePositionConfirmations = async (value: boolean) => {
    setSkipClosePositionConfirmations(value);
    try {
      await AsyncStorage.setItem(SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save skip close position confirmations preference:', error);
    }
  };

  if (!isReady) {
    return <SkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.section}>
            <View style={styles.walletInfoRow}>
              <Text style={styles.infoText}>
                {formatAddress(address)}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAddress}
                activeOpacity={0.7}
              >
                <Octicons name="copy" size={16} color={Color.BRIGHT_ACCENT} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.settingsRow}
              onPress={() => handleToggleShowTrades(!showTradesOnChart)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsLabel}>Show Buys and Sells on Chart</Text>
              <View style={[
                styles.customCheckbox,
                showTradesOnChart && styles.customCheckboxChecked
              ]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingsRow}
              onPress={() => handleToggleSkipOpenOrderConfirmations(!skipOpenOrderConfirmations)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsLabel}>Skip Open Order Confirmations</Text>
              <View style={[
                styles.customCheckbox,
                skipOpenOrderConfirmations && styles.customCheckboxChecked
              ]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingsRow}
              onPress={() => handleToggleSkipClosePositionConfirmations(!skipClosePositionConfirmations)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsLabel}>Skip Close Position Confirmations</Text>
              <View style={[
                styles.customCheckbox,
                skipClosePositionConfirmations && styles.customCheckboxChecked
              ]} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


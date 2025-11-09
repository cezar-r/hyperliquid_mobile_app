import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsRow from './SettingsRow';
import { styles } from '../styles/SettingsContainer.styles';
import EnableTradingRow from './enable_trading_row/EnableTradingRow';

const SHOW_TRADES_KEY = '@show_trades_on_chart';
const SKIP_OPEN_ORDER_CONFIRMATIONS_KEY = '@skip_open_order_confirmations';
const SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY = '@skip_close_position_confirmations';

export default function SettingsContainer(): React.JSX.Element {
  const [showTradesOnChart, setShowTradesOnChart] = useState(false);
  const [skipOpenOrderConfirmations, setSkipOpenOrderConfirmations] = useState(false);
  const [skipClosePositionConfirmations, setSkipClosePositionConfirmations] = useState(false);

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

  return (
    <View style={styles.section}>
      <EnableTradingRow />
      <SettingsRow
        label="Show Buys and Sells on Chart"
        value={showTradesOnChart}
        onToggle={handleToggleShowTrades}
      />
      <SettingsRow
        label="Skip Open Order Confirmations"
        value={skipOpenOrderConfirmations}
        onToggle={handleToggleSkipOpenOrderConfirmations}
      />
      <SettingsRow
        label="Skip Close Position Confirmations"
        value={skipClosePositionConfirmations}
        onToggle={handleToggleSkipClosePositionConfirmations}
      />
    </View>
  );
}


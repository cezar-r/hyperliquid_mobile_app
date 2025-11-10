import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsRow from './SettingsRow';
import ClearCacheRow from './ClearCacheRow';
import { styles } from '../styles/SettingsContainer.styles';
import AutoApproveRow from './auto_approve_row/AutoApproveRow';

const SHOW_TRADES_KEY = '@show_trades_on_chart';
const SKIP_OPEN_ORDER_CONFIRMATIONS_KEY = '@skip_open_order_confirmations';
const SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY = '@skip_close_position_confirmations';
const HIDE_SMALL_BALANCES_KEY = '@hide_small_balances';

export default function SettingsContainer(): React.JSX.Element {
  const [showTradesOnChart, setShowTradesOnChart] = useState(false);
  const [skipOpenOrderConfirmations, setSkipOpenOrderConfirmations] = useState(false);
  const [skipClosePositionConfirmations, setSkipClosePositionConfirmations] = useState(false);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

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

        const hideSmallBalancesValue = await AsyncStorage.getItem(HIDE_SMALL_BALANCES_KEY);
        if (hideSmallBalancesValue !== null) {
          setHideSmallBalances(hideSmallBalancesValue === 'true');
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

  const handleToggleHideSmallBalances = async (value: boolean) => {
    setHideSmallBalances(value);
    try {
      await AsyncStorage.setItem(HIDE_SMALL_BALANCES_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save hide small balances preference:', error);
    }
  };

  return (
    <View style={styles.section}>
      <AutoApproveRow />
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
      <SettingsRow
        label="Hide Small Balances"
        value={hideSmallBalances}
        onToggle={handleToggleHideSmallBalances}
      />
      <ClearCacheRow />
    </View>
  );
}


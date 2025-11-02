/**
 * Confirmation preferences utility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SKIP_OPEN_ORDER_CONFIRMATIONS_KEY = '@skip_open_order_confirmations';
const SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY = '@skip_close_position_confirmations';

/**
 * Get the user's preference for skipping open order confirmations
 * @returns Promise<boolean> - true if confirmations should be skipped
 */
export async function getSkipOpenOrderConfirmations(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SKIP_OPEN_ORDER_CONFIRMATIONS_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to load skip open order confirmations preference:', error);
    return false; // Default to showing confirmations
  }
}

/**
 * Set the user's preference for skipping open order confirmations
 * @param skip - true to skip confirmations, false to show them
 */
export async function setSkipOpenOrderConfirmations(skip: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SKIP_OPEN_ORDER_CONFIRMATIONS_KEY, skip.toString());
  } catch (error) {
    console.error('Failed to save skip open order confirmations preference:', error);
  }
}

/**
 * Get the user's preference for skipping close position confirmations
 * @returns Promise<boolean> - true if confirmations should be skipped
 */
export async function getSkipClosePositionConfirmations(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to load skip close position confirmations preference:', error);
    return false; // Default to showing confirmations
  }
}

/**
 * Set the user's preference for skipping close position confirmations
 * @param skip - true to skip confirmations, false to show them
 */
export async function setSkipClosePositionConfirmations(skip: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SKIP_CLOSE_POSITION_CONFIRMATIONS_KEY, skip.toString());
  } catch (error) {
    console.error('Failed to save skip close position confirmations preference:', error);
  }
}


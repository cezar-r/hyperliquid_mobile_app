import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrivateKeyAccount } from 'viem/accounts';

const SESSION_KEY_STORAGE_KEY = 'hl_session_key';
const SESSION_EXPIRY_STORAGE_KEY = 'hl_session_expiry';
const SESSION_WALLET_ADDRESS_KEY = 'hl_session_wallet_address';
const AUTO_APPROVE_PREFERENCE_KEY = '@auto_approve_preference';

export interface SessionKey {
  privateKey: `0x${string}`;
  address: string;
  expiresAt: number;
}

export interface SessionKeyWithWallet {
  sessionKey: SessionKey;
  walletAddress: string;
}

const SESSION_KEY_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function generateSessionKey(): SessionKey {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const expiresAt = Date.now() + SESSION_KEY_DURATION_MS;

  return {
    privateKey,
    address: account.address,
    expiresAt,
  };
}

export async function saveSessionKey(
  sessionKey: SessionKey,
  walletAddress: string
): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      SESSION_KEY_STORAGE_KEY,
      sessionKey.privateKey
    );
    await SecureStore.setItemAsync(
      SESSION_EXPIRY_STORAGE_KEY,
      sessionKey.expiresAt.toString()
    );
    await SecureStore.setItemAsync(
      SESSION_WALLET_ADDRESS_KEY,
      walletAddress
    );
    console.log('[SessionKey] Session key saved securely for wallet:', walletAddress);
  } catch (error) {
    console.error('[SessionKey] Failed to save session key:', error);
    throw error;
  }
}

export async function loadSessionKey(): Promise<SessionKey | null> {
  try {
    const privateKey = await SecureStore.getItemAsync(SESSION_KEY_STORAGE_KEY);
    const expiryStr = await SecureStore.getItemAsync(
      SESSION_EXPIRY_STORAGE_KEY
    );

    if (!privateKey || !expiryStr) {
      return null;
    }

    const expiresAt = parseInt(expiryStr, 10);

    if (Date.now() > expiresAt) {
      console.log('[SessionKey] Session key expired, clearing...');
      await clearSessionKey();
      return null;
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    return {
      privateKey: privateKey as `0x${string}`,
      address: account.address,
      expiresAt,
    };
  } catch (error) {
    console.error('[SessionKey] Failed to load session key:', error);
    return null;
  }
}

export async function loadSessionKeyWithWallet(): Promise<SessionKeyWithWallet | null> {
  try {
    const privateKey = await SecureStore.getItemAsync(SESSION_KEY_STORAGE_KEY);
    const expiryStr = await SecureStore.getItemAsync(SESSION_EXPIRY_STORAGE_KEY);
    const walletAddress = await SecureStore.getItemAsync(SESSION_WALLET_ADDRESS_KEY);

    if (!privateKey || !expiryStr) {
      return null;
    }

    const expiresAt = parseInt(expiryStr, 10);

    if (Date.now() > expiresAt) {
      console.log('[SessionKey] Session key expired, clearing...');
      await clearSessionKey();
      return null;
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    return {
      sessionKey: {
        privateKey: privateKey as `0x${string}`,
        address: account.address,
        expiresAt,
      },
      walletAddress: walletAddress || '',
    };
  } catch (error) {
    console.error('[SessionKey] Failed to load session key with wallet:', error);
    return null;
  }
}

export async function clearSessionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY_STORAGE_KEY);
    await SecureStore.deleteItemAsync(SESSION_EXPIRY_STORAGE_KEY);
    await SecureStore.deleteItemAsync(SESSION_WALLET_ADDRESS_KEY);
    console.log('[SessionKey] Session key cleared');
  } catch (error) {
    console.error('[SessionKey] Failed to clear session key:', error);
  }
}

export function createSessionAccount(
  privateKey: `0x${string}`
): PrivateKeyAccount {
  return privateKeyToAccount(privateKey);
}

export function isSessionKeyExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function getSessionKeyExpiryDate(expiresAt: number): Date {
  return new Date(expiresAt);
}

// Auto-approve preference functions
export async function getAutoApprovePreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(AUTO_APPROVE_PREFERENCE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setAutoApprovePreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTO_APPROVE_PREFERENCE_KEY, enabled.toString());
    console.log('[SessionKey] Auto-approve preference set to:', enabled);
  } catch (error) {
    console.error('[SessionKey] Failed to set auto-approve preference:', error);
  }
}


import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as SecureStore from 'expo-secure-store';
import type { PrivateKeyAccount } from 'viem/accounts';

const SESSION_KEY_STORAGE_KEY = 'hl_session_key';
const SESSION_EXPIRY_STORAGE_KEY = 'hl_session_expiry';

export interface SessionKey {
  privateKey: `0x${string}`;
  address: string;
  expiresAt: number;
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
  sessionKey: SessionKey
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
    console.log('[SessionKey] Session key saved securely');
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

export async function clearSessionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY_STORAGE_KEY);
    await SecureStore.deleteItemAsync(SESSION_EXPIRY_STORAGE_KEY);
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


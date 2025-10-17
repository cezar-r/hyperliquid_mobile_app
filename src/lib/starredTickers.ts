import { storage } from './storage';
import type { MarketType } from '../types';

const STORAGE_KEYS = {
  perp: 'starred_tickers_perp',
  spot: 'starred_tickers_spot',
};

/**
 * Get all starred tickers for a given market type
 */
export async function getStarredTickers(marketType: MarketType): Promise<string[]> {
  try {
    const key = STORAGE_KEYS[marketType];
    const starred = await storage.getItem<string[]>(key);
    return starred || [];
  } catch (error) {
    console.error('[StarredTickers] Error getting starred tickers:', error);
    return [];
  }
}

/**
 * Check if a ticker is starred for a given market type
 */
export async function isTickerStarred(ticker: string, marketType: MarketType): Promise<boolean> {
  try {
    const starred = await getStarredTickers(marketType);
    return starred.includes(ticker);
  } catch (error) {
    console.error('[StarredTickers] Error checking if ticker is starred:', error);
    return false;
  }
}

/**
 * Toggle starred state for a ticker in a given market type
 * Returns the new starred state (true if now starred, false if unstarred)
 */
export async function toggleStarredTicker(ticker: string, marketType: MarketType): Promise<boolean> {
  try {
    const key = STORAGE_KEYS[marketType];
    const starred = await getStarredTickers(marketType);
    
    const isCurrentlyStarred = starred.includes(ticker);
    let newStarred: string[];
    
    if (isCurrentlyStarred) {
      // Remove from starred
      newStarred = starred.filter(t => t !== ticker);
    } else {
      // Add to starred
      newStarred = [...starred, ticker];
    }
    
    await storage.setItem(key, newStarred);
    
    console.log(`[StarredTickers] Toggled ${ticker} in ${marketType}: ${!isCurrentlyStarred ? 'starred' : 'unstarred'}`);
    
    return !isCurrentlyStarred;
  } catch (error) {
    console.error('[StarredTickers] Error toggling starred ticker:', error);
    return false;
  }
}


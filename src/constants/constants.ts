export const SPOT_TICKER_MAP = {
  'UBTC': 'BTC',
  'USOL': 'SOL',
  'UETH': 'ETH',
  'UXPL': 'XPL',
  'UPUMP': 'PUMP',
  'UUUSPX': 'SPX',
  'UBONK': 'BONK',
  'UMOG': 'MOG',
  'UWLD': 'WLD',
  'UENA': 'ENA',
  'UFART': 'FART',
};

/**
 * HIP-3 builder-deployed dex names.
 * Empty string '' represents the default Hyperliquid perp dex.
 *
 * Note: HIP-3 dexes have their own separate universes with unique markets.
 * For example, xyz has stocks like NVDA, TSLA, etc. that don't exist in the default universe.
 * These markets appear in both the HIP-3 meta API and allMids WebSocket feed.
 */
export const HIP3_DEXES = ['xyz', 'flx', 'vntl', 'hyna'] as const;
export type Dex = '' | typeof HIP3_DEXES[number];

/**
 * HIP-3 dex indices for asset ID calculation.
 *
 * Asset ID formula: 100000 + (perpDexIndex * 10000) + indexInMeta
 *
 * perpDexIndex 0 = default Hyperliquid dex (uses regular 0-based indices)
 * perpDexIndex 1+ = HIP-3 dexes
 *
 * Note: These indices are assigned when the dex is deployed.
 * If a new HIP-3 dex is added, its index needs to be looked up.
 */
export const HIP3_DEX_INDICES: Record<string, number> = {
  'xyz': 1,
  'flx': 2,
  'vntl': 3,
  'hyna': 4,
};

/**
 * Calculate the asset ID for a HIP-3 market.
 *
 * @param dex - The dex name (e.g., 'xyz', 'vntl')
 * @param indexInMeta - The index of the asset within the dex's meta universe
 * @returns The calculated asset ID for order placement
 */
export function calculateHip3AssetId(dex: string, indexInMeta: number): number {
  const dexIndex = HIP3_DEX_INDICES[dex];
  if (dexIndex === undefined) {
    console.warn(`[HIP-3] Unknown dex "${dex}", using index 0`);
    return indexInMeta;
  }
  // Formula: 100000 + (perpDexIndex * 10000) + indexInMeta
  return 100000 + (dexIndex * 10000) + indexInMeta;
}

/**
 * HIP-3 dex collateral token names.
 * Maps dex name to the collateral token symbol used for margin.
 *
 * - xyz: Uses USDC (collateralToken index 0)
 * - vntl: Uses USDH (collateralToken index 360)
 */
export const HIP3_COLLATERAL: Record<string, string> = {
  'xyz': 'USDC',
  'flx': 'USDH',
  'vntl': 'USDH',
  'hyna': 'USDE',
};
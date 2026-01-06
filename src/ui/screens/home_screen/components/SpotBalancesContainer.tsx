import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/SpotBalancesContainer.styles';
import SpotBalanceCell from './SpotBalanceCell';
import type { SpotBalance } from '../../../../types';
import { getDisplayTicker } from '../../../../lib/formatting';

interface SpotBalancesContainerProps {
  sortedBalances: Array<{
    balance: SpotBalance;
    price: string | undefined;
    total: number;
    usdValue: number;
    pnl: {
      pnl: number;
      pnlPercent: number;
    };
    assetContext?: any;
  }>;
  spotMarkets: Array<{ name: string; index: number; szDecimals?: number }>;
  onNavigateToChart: (coin: string, market: 'perp' | 'spot') => void;
  showLabel: boolean;
}

function SpotBalancesContainer({
  sortedBalances,
  spotMarkets,
  onNavigateToChart,
  showLabel,
}: SpotBalancesContainerProps): React.JSX.Element | null {
  if (sortedBalances.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, showLabel && styles.spotSection]}>
      {showLabel && <Text style={styles.balancesLabel}>Balances</Text>}
      {sortedBalances.map((item) => {
        // Find the spot market for this coin to get the full pair name
        const spotMarket = spotMarkets.find(
          (m) => m.name.split('/')[0] === item.balance.coin
        );
        const displayName = spotMarket
          ? getDisplayTicker(spotMarket.name)
          : item.balance.coin;
        const marketName = spotMarket?.name || item.balance.coin;

        return (
          <SpotBalanceCell
            key={`spot-${item.balance.coin}`}
            balance={item.balance}
            price={item.price}
            total={item.total}
            usdValue={item.usdValue}
            pnl={item.pnl}
            assetContext={item.assetContext}
            displayName={displayName}
            sparklineMarketName={marketName}
            onPress={() => {
              // Don't navigate for USDC
              if (item.balance.coin === 'USDC') return;
              // Pass the full market name for spot (e.g., "UBTC/USDC")
              onNavigateToChart(marketName, 'spot');
            }}
          />
        );
      })}
    </View>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders from parent
export default React.memo(SpotBalancesContainer);


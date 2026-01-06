import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';
import { styles } from '../styles/PerpPositionsContainer.styles';
import PerpPositionCell from './PerpPositionCell';
import type { PerpPosition } from '../../../../types';
import { playTextButtonHaptic } from '../../../../lib/haptics';

interface PerpPositionsContainerProps {
  sortedPositions: Array<{
    position: PerpPosition;
    price: string | undefined;
    marginUsed: number;
    pnl: {
      pnl: number;
      pnlPercent: number;
    };
    assetContext?: any;
  }>;
  withdrawableUsdc: number;
  onNavigateToChart: (coin: string, market: 'perp' | 'spot') => void;
  showCloseAll: boolean;
  onCloseAll?: () => void;
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

function PerpPositionsContainer({
  sortedPositions,
  withdrawableUsdc,
  onNavigateToChart,
  showCloseAll,
  onCloseAll,
}: PerpPositionsContainerProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {showCloseAll && sortedPositions.length > 0 && (
        <View style={styles.perpsHeaderRow}>
          <Text style={styles.sectionLabel}>Perps</Text>
          <TouchableOpacity onPress={() => {
            playTextButtonHaptic();
            onCloseAll?.();
          }}>
            <Text style={styles.closeAllText}>Close All</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCloseAll && sortedPositions.length === 0 && (
        <Text style={styles.sectionLabel}>Perps</Text>
      )}

      {/* USDC Withdrawable (Perp Account) */}
      <View style={sharedStyles.positionCell}>
        <View style={sharedStyles.leftSide}>
          <View style={sharedStyles.tickerContainer}>
            <Text style={sharedStyles.ticker}>USDC</Text>
          </View>
          <View style={sharedStyles.priceContainer}>
            <Text style={sharedStyles.size}>Withdrawable</Text>
          </View>
        </View>
        <View style={sharedStyles.rightSide}>
          <Text style={sharedStyles.price}>${formatNumber(withdrawableUsdc, 2)}</Text>
          <Text style={[sharedStyles.pnl, { color: Color.FG_3 }]}>
            {formatNumber(withdrawableUsdc, 2)} USDC
          </Text>
        </View>
      </View>
      <View style={sharedStyles.separator} />

      {sortedPositions.map((item) => {
        // For HIP-3 positions, use dex:coin format
        const marketKey = item.position.dex
          ? `${item.position.dex}:${item.position.coin}`
          : item.position.coin;
        return (
          <PerpPositionCell
            key={`perp-${marketKey}`}
            position={item.position}
            price={item.price}
            marginUsed={item.marginUsed}
            pnl={item.pnl}
            assetContext={item.assetContext}
            onPress={() => onNavigateToChart(marketKey, 'perp')}
          />
        );
      })}
    </View>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders from parent
export default React.memo(PerpPositionsContainer);


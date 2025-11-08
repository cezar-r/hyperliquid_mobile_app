import React from 'react';
import { View } from 'react-native';
import { styles } from '../styles/EquityBreakdown.styles';
import EquityRow from './EquityRow';
import type { MarketFilter } from './MarketDropdown';

interface EquityBreakdownProps {
  perpAccountValue: number;
  spotTotalValue: number;
  stakingValue: number;
  withdrawable: string;
  marketFilter: MarketFilter;
  showPerps: boolean;
  showSpot: boolean;
  showStaking: boolean;
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 2): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export default function EquityBreakdown({
  perpAccountValue,
  spotTotalValue,
  stakingValue,
  withdrawable,
  marketFilter,
  showPerps,
  showSpot,
  showStaking,
}: EquityBreakdownProps): React.JSX.Element {
  return (
    <View style={styles.accountDetailsContainer}>
      <View style={styles.equityBreakdownContainer}>
        {(showPerps || marketFilter === 'Account') && perpAccountValue > 0 && (
          <EquityRow label="Perp" value={`$${formatNumber(perpAccountValue, 2)}`} />
        )}
        {(showSpot || marketFilter === 'Account') && spotTotalValue > 0 && (
          <EquityRow label="Spot" value={`$${formatNumber(spotTotalValue, 2)}`} />
        )}
        {showStaking && marketFilter === 'Account' && stakingValue > 0 && (
          <EquityRow label="Staking" value={`$${formatNumber(stakingValue, 2)}`} />
        )}
        {withdrawable && (
          <EquityRow
            label="Withdrawable"
            value={`$${parseFloat(withdrawable).toFixed(2)}`}
          />
        )}
      </View>
    </View>
  );
}


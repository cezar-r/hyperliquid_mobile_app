import React from 'react';
import { View, Text } from 'react-native';
import { Color } from '../../../shared/styles';
import { sharedStyles } from '../styles/shared.styles';

interface StakingCellProps {
  delegation: {
    validator: string;
    amount: string;
  };
  hypePrice: number;
  usdValue: number;
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

export default function StakingCell({
  delegation,
  hypePrice,
  usdValue,
}: StakingCellProps): React.JSX.Element {
  const delegationAmount = parseFloat(delegation.amount);

  return (
    <View>
      <View style={sharedStyles.positionCell}>
        <View style={sharedStyles.leftSide}>
          <View style={sharedStyles.tickerContainer}>
            <Text style={sharedStyles.ticker}>HYPE Foundation 1</Text>
          </View>
          <View style={sharedStyles.priceContainer}>
            <Text style={sharedStyles.size}>
              {delegationAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{' '}
              HYPE
            </Text>
          </View>
        </View>
        <View style={sharedStyles.rightSide}>
          <Text style={sharedStyles.price}>${formatNumber(usdValue, 2)}</Text>
          <Text style={[sharedStyles.pnl, { color: Color.FG_3 }]}>
            {hypePrice > 0 ? `$${formatNumber(hypePrice, 2)} / HYPE` : '--'}
          </Text>
        </View>
      </View>
      <View style={sharedStyles.separator} />
    </View>
  );
}


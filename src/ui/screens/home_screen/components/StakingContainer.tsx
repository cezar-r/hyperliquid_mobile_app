import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/StakingContainer.styles';
import StakingCell from './StakingCell';

interface StakingContainerProps {
  delegations: Array<{
    validator: string;
    amount: string;
  }>;
  hypePrice: number;
}

export default function StakingContainer({
  delegations,
  hypePrice,
}: StakingContainerProps): React.JSX.Element | null {
  if (!delegations || delegations.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, styles.stakingSection]}>
      <Text style={styles.sectionLabel}>Staking</Text>
      {delegations.map((delegation, idx) => {
        const delegationAmount = parseFloat(delegation.amount);
        const usdValue = delegationAmount * hypePrice;

        return (
          <StakingCell
            key={`staking-${idx}`}
            delegation={delegation}
            hypePrice={hypePrice}
            usdValue={usdValue}
          />
        );
      })}
    </View>
  );
}


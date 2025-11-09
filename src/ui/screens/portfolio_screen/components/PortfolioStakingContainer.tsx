import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/PortfolioStakingContainer.styles';
import StakingInfoCell from './StakingInfoCell';
import DelegationCell from './DelegationCell';
import type { MarketFilter } from './MarketDropdown';
import { playPrimaryButtonHaptic } from '../../../../lib/haptics';

interface StakingDelegation {
  validator: `0x${string}`;
  amount: string;
}

interface PortfolioStakingContainerProps {
  stakingSummary: {
    delegated: string;
    undelegated: string;
    totalPendingWithdrawal: string;
    nPendingWithdrawals: number;
  } | null;
  spotHypeBalance: number;
  stakingDelegations: StakingDelegation[];
  marketFilter: MarketFilter;
  onTransferToStakingPress: () => void;
  onTransferToSpotPress: () => void;
  onDelegatePress: () => void;
  onUndelegatePress: (delegation: { validator: `0x${string}`; amount: string }) => void;
}

export default function PortfolioStakingContainer({
  stakingSummary,
  spotHypeBalance,
  stakingDelegations,
  marketFilter,
  onTransferToStakingPress,
  onTransferToSpotPress,
  onDelegatePress,
  onUndelegatePress,
}: PortfolioStakingContainerProps): React.JSX.Element {
  const totalStaked = stakingSummary
    ? parseFloat(stakingSummary.delegated || '0') + parseFloat(stakingSummary.undelegated || '0')
    : 0;

  const hasSpotHype = spotHypeBalance > 0;
  const hasUndelegated = stakingSummary && parseFloat(stakingSummary.undelegated || '0') > 0;

  return (
    <View style={styles.stakingSection}>
      {marketFilter === 'Account' && <Text style={styles.sectionLabel}>Staking</Text>}
      <View style={styles.stakingCard}>
        {/* Staking Summary */}
        <View style={styles.stakingSummaryRow}>
          <StakingInfoCell
            label="Total Staked"
            value={`${totalStaked.toFixed(2)} HYPE`}
            sublabel={
              stakingSummary
                ? `Delegated: ${parseFloat(stakingSummary.delegated || '0').toFixed(2)} HYPE`
                : undefined
            }
          />

          <StakingInfoCell
            label="Spot Balance"
            value={`${spotHypeBalance.toFixed(2)} HYPE`}
            sublabel="Available to stake"
          />
        </View>

        <View style={styles.stakingSummaryRow}>
          <StakingInfoCell
            label="Available to Delegate"
            value={`${stakingSummary ? parseFloat(stakingSummary.undelegated || '0').toFixed(2) : '0.00'} HYPE`}
            sublabel="In staking balance"
          />

          <StakingInfoCell
            label="Pending Transfers"
            value={`${stakingSummary ? parseFloat(stakingSummary.totalPendingWithdrawal || '0').toFixed(2) : '0.00'} HYPE`}
            sublabel={`${stakingSummary?.nPendingWithdrawals || 0} pending`}
          />
        </View>

        {/* Transfer Buttons */}
        <View style={styles.stakingButtons}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => {
              playPrimaryButtonHaptic();
              onTransferToStakingPress();
            }}
            disabled={!hasSpotHype}
          >
            <Text style={styles.depositButtonText}>Transfer to Staking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => {
              playPrimaryButtonHaptic();
              onTransferToSpotPress();
            }}
            disabled={!hasUndelegated}
          >
            <Text style={styles.withdrawButtonText}>Transfer to Spot</Text>
          </TouchableOpacity>
        </View>

        {/* Delegate Button */}
        {hasUndelegated && (
          <TouchableOpacity style={styles.delegateButton} onPress={() => {
            playPrimaryButtonHaptic();
            onDelegatePress();
          }}>
            <Text style={styles.delegateButtonText}>Delegate to Validator</Text>
          </TouchableOpacity>
        )}

        {/* Delegations List */}
        {stakingDelegations.length > 0 && (
          <View style={styles.delegationsContainer}>
            <Text style={styles.delegationsTitle}>Active Delegations</Text>
            {stakingDelegations.map((delegation, idx) => (
              <DelegationCell
                key={`delegation-${idx}`}
                validatorName="HYPE Foundation 1"
                validatorAddress={delegation.validator}
                amount={delegation.amount}
                onUndelegatePress={() => onUndelegatePress(delegation)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}


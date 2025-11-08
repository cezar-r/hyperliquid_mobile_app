import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/DelegationCell.styles';

interface DelegationCellProps {
  validatorName: string;
  validatorAddress: string;
  amount: string;
  onUndelegatePress: () => void;
}

export default function DelegationCell({
  validatorName,
  validatorAddress,
  amount,
  onUndelegatePress,
}: DelegationCellProps): React.JSX.Element {
  return (
    <View style={styles.delegationCard}>
      <View style={styles.delegationHeader}>
        <Text style={styles.delegationValidator}>{validatorName}</Text>
        <Text style={styles.delegationAmount}>{parseFloat(amount).toFixed(2)} HYPE</Text>
      </View>
      <Text style={styles.delegationAddress}>
        {validatorAddress.slice(0, 10)}...{validatorAddress.slice(-8)}
      </Text>
      <TouchableOpacity style={styles.undelegateButton} onPress={onUndelegatePress}>
        <Text style={styles.undelegateButtonText}>Undelegate</Text>
      </TouchableOpacity>
    </View>
  );
}


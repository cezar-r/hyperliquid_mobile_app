import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/FundsActionsContainer.styles';

interface FundsActionsContainerProps {
  onDepositPress: () => void;
  onWithdrawPress: () => void;
  onTransferPress: () => void;
}

export default function FundsActionsContainer({
  onDepositPress,
  onWithdrawPress,
  onTransferPress,
}: FundsActionsContainerProps): React.JSX.Element {
  return (
    <View style={styles.accountDetailsContainer}>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.depositButton} onPress={onDepositPress}>
          <Text style={styles.depositButtonText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawButton} onPress={onWithdrawPress}>
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Perp <-> Spot Transfer Button */}
      <View style={styles.transferContainer}>
        <TouchableOpacity style={styles.transferButton} onPress={onTransferPress}>
          <Text style={styles.transferButtonText}>Perp ↔ Spot Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


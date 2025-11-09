import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/FundsActionsContainer.styles';
import { playPrimaryButtonHaptic } from '../../../../lib/haptics';

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
        <TouchableOpacity style={styles.depositButton} onPress={() => {
          playPrimaryButtonHaptic();
          onDepositPress();
        }}>
          <Text style={styles.depositButtonText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawButton} onPress={() => {
          playPrimaryButtonHaptic();
          onWithdrawPress();
        }}>
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Perp <-> Spot Transfer Button */}
      <View style={styles.transferContainer}>
        <TouchableOpacity style={styles.transferButton} onPress={() => {
          playPrimaryButtonHaptic();
          onTransferPress();
        }}>
          <Text style={styles.transferButtonText}>Perp ↔ Spot Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


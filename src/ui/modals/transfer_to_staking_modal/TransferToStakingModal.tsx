import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWallet } from '../../../contexts/WalletContext';
import { styles } from './styles/TransferToStakingModal.styles';
import { ModalHeader, AvailableContainer, InputContainer, StakingConfirmStep, PendingStep, SuccessStep, ErrorStep } from '../shared/components';

interface TransferToStakingModalProps {
  visible: boolean;
  onClose: () => void;
  maxAmount: number;
}

type Step = 'form' | 'confirm' | 'pending' | 'success' | 'error';

export default function TransferToStakingModal({
  visible,
  onClose,
  maxAmount,
}: TransferToStakingModalProps): React.JSX.Element {
  const { mainExchangeClient, refetchAccount } = useWallet();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));

  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum > 0 && amountNum <= maxAmount;

  useEffect(() => {
    if (visible) {
      setStep('form');
      setAmount('');
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxAmount.toFixed(6));
  };

  const handleConfirm = () => {
    if (!isValid) {
      setError('Invalid amount');
      return;
    }
    setStep('confirm');
  };

  const handleExecute = async () => {
    if (!mainExchangeClient) {
      setError('Exchange client not available');
      return;
    }

    setStep('pending');
    setError(null);

    try {
      // Convert amount to wei (multiply by 1e8)
      const wei = Math.floor(amountNum * 1e8);

      console.log('[Staking] Transferring to staking:', { amount: amountNum, wei });

      const result = await mainExchangeClient.cDeposit({ wei });

      console.log('[Staking] Transfer to staking result:', result);

      setStep('success');

      // Refetch account data after a delay
      setTimeout(() => {
        refetchAccount();
      }, 3000);
    } catch (err: any) {
      console.error('[Staking] Transfer to staking failed:', err);
      setError(err.message || 'Transfer failed');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'pending') {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Form Step */}
          {step === 'form' && (
            <View style={styles.content}>
              <ModalHeader title="Transfer to Staking" onClose={onClose} />

              <View style={styles.body}>
                <Text style={styles.description}>
                  Transfer HYPE from your spot balance to your staking balance. You can then delegate to validators to earn rewards.
                </Text>

                <AvailableContainer
                  label="Available in Spot:"
                  amount={`${maxAmount.toFixed(6)} HYPE`}
                />

                <InputContainer
                  label="Amount"
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  onMaxPress={handleMaxClick}
                  autoFocus={true}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, !isValid && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={!isValid}
                >
                  <Text style={styles.confirmButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <View style={styles.content}>
              <ModalHeader title="Confirm Transfer" onClose={onClose} />

              <View style={styles.body}>
                <StakingConfirmStep
                  details={[
                    { label: 'Amount:', value: `${amountNum.toFixed(6)} HYPE` },
                    { label: 'From:', value: 'Spot Balance' },
                    { label: 'To:', value: 'Staking Balance' },
                  ]}
                  warningText="⚠️ Once transferred, you must delegate to validators to earn rewards."
                  onBack={() => setStep('form')}
                  onConfirm={handleExecute}
                  confirmText="Confirm Transfer"
                />
              </View>
            </View>
          )}

          {/* Pending Step */}
          {step === 'pending' && (
            <View style={styles.content}>
              <ModalHeader title="Processing..." onClose={onClose} />

              <View style={styles.body}>
                <PendingStep
                  title=""
                  description={`Transferring ${amountNum.toFixed(6)} HYPE to staking...`}
                  footerText="Please confirm the transaction in your wallet"
                />
              </View>
            </View>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <View style={styles.content}>
              <ModalHeader title="Transfer Successful!" onClose={onClose} />

              <View style={styles.body}>
                <SuccessStep
                  title=""
                  description={`Successfully transferred ${amountNum.toFixed(6)} HYPE to staking balance\nYou can now delegate to validators to earn rewards`}
                  onClose={onClose}
                />
              </View>
            </View>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <View style={styles.content}>
              <ModalHeader title="Transfer Failed" onClose={onClose} />

              <View style={styles.body}>
                <ErrorStep
                  title=""
                  error={error}
                  onClose={onClose}
                  onRetry={() => setStep('form')}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


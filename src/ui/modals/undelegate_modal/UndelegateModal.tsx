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
import { styles } from './styles/UndelegateModal.styles';
import { ModalHeader, ValidatorInfoContainer, InputContainer, PendingStep, SuccessStep, ErrorStep } from '../shared/components';
import { fontSizes } from '../../shared/styles/typography';
import { Color } from '../../shared/styles/colors';

interface UndelegateModalProps {
  visible: boolean;
  onClose: () => void;
  validator: `0x${string}`;
  maxAmount: number;
}

type Step = 'form' | 'confirm' | 'pending' | 'success' | 'error';

const VALIDATOR_NAME = 'HYPE Foundation 1';

export default function UndelegateModal({
  visible,
  onClose,
  validator,
  maxAmount,
}: UndelegateModalProps): React.JSX.Element {
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
      const wei = Math.floor(amountNum * 1e8);

      console.log('[Staking] Undelegating:', { amount: amountNum, wei, validator });

      const result = await mainExchangeClient.tokenDelegate({
        validator,
        wei,
        isUndelegate: true,
      });

      console.log('[Staking] Undelegation result:', result);

      setStep('success');

      setTimeout(() => {
        refetchAccount();
      }, 3000);
    } catch (err: any) {
      console.error('[Staking] Undelegation failed:', err);
      setError(err.message || 'Undelegation failed');
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
              <ModalHeader title="Undelegate from Validator" onClose={onClose} />

              <View style={styles.body}>
                <Text style={styles.description}>
                  Remove your delegation from the validator. There is a 7-14 day lock period before you can transfer to spot.
                </Text>

                <ValidatorInfoContainer
                  validatorName={VALIDATOR_NAME}
                  validatorAddress={validator}
                  variant="undelegate"
                />

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Delegated Amount:</Text>
                  <Text style={styles.balanceValue}>{maxAmount.toFixed(6)} HYPE</Text>
                </View>

                <InputContainer
                  label="Amount to Undelegate"
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
              <ModalHeader title="Confirm Undelegation" onClose={onClose} />

              <View style={styles.body}>
                <View style={styles.confirmSection}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Amount:</Text>
                    <Text style={styles.confirmValue}>{amountNum.toFixed(6)} HYPE</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Validator:</Text>
                    <Text style={styles.confirmValue}>{VALIDATOR_NAME}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Action:</Text>
                    <Text style={styles.confirmValue}>Undelegate</Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Undelegated tokens will be locked for 7-14 days before becoming available to withdraw.
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('form')}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleExecute}>
                  <Text style={styles.confirmButtonText}>Undelegate</Text>
                </TouchableOpacity>
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
                  description={`Undelegating ${amountNum.toFixed(6)} HYPE...`}
                  footerText="Please confirm the transaction in your wallet"
                />
              </View>
            </View>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <View style={styles.content}>
              <ModalHeader title="Undelegation Successful!" onClose={onClose} />

              <View style={styles.body}>
                <SuccessStep
                  title=""
                  description={`Successfully undelegated ${amountNum.toFixed(6)} HYPE\nTokens will be available after the lock period`}
                  onClose={onClose}
                />
              </View>
            </View>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <View style={styles.content}>
              <ModalHeader title="Undelegation Failed" onClose={onClose} />

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


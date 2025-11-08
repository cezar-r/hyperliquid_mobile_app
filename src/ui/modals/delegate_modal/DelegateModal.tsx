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
import { styles } from './styles/DelegateModal.styles';
import { ModalHeader, ValidatorInfoContainer, InputContainer, PendingStep, SuccessStep, ErrorStep } from '../shared/components';
import { fontSizes } from '../../shared/styles/typography';
import { Color } from '../../shared/styles/colors';

interface DelegateModalProps {
  visible: boolean;
  onClose: () => void;
  maxAmount: number;
}

type Step = 'form' | 'confirm' | 'pending' | 'success' | 'error';

const DEFAULT_VALIDATOR = '0x5ac99df645f3414876c816caa18b2d234024b487';
const VALIDATOR_NAME = 'HYPE Foundation 1';

export default function DelegateModal({
  visible,
  onClose,
  maxAmount,
}: DelegateModalProps): React.JSX.Element {
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

      console.log('[Staking] Delegating:', { amount: amountNum, wei, validator: DEFAULT_VALIDATOR });

      const result = await mainExchangeClient.tokenDelegate({
        validator: DEFAULT_VALIDATOR as `0x${string}`,
        wei,
        isUndelegate: false,
      });

      console.log('[Staking] Delegation result:', result);

      setStep('success');

      setTimeout(() => {
        refetchAccount();
      }, 3000);
    } catch (err: any) {
      console.error('[Staking] Delegation failed:', err);
      setError(err.message || 'Delegation failed');
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
              <ModalHeader title="Delegate to Validator" onClose={onClose} />

              <View style={styles.body}>
                <Text style={styles.description}>
                  Delegate your HYPE to a validator to earn staking rewards and help secure the network.
                </Text>

                <ValidatorInfoContainer
                  validatorName={VALIDATOR_NAME}
                  validatorAddress={DEFAULT_VALIDATOR}
                  variant="delegate"
                />

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Available to Delegate:</Text>
                  <Text style={styles.balanceValue}>{maxAmount.toFixed(6)} HYPE</Text>
                </View>

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
              <ModalHeader title="Confirm Delegation" onClose={onClose} />

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
                    <Text style={styles.confirmValue}>Delegate</Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Once delegated, you will start earning rewards. To withdraw, you must first undelegate (7-14 day lock period).
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('form')}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleExecute}>
                  <Text style={styles.confirmButtonText}>Delegate</Text>
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
                  description={`Delegating ${amountNum.toFixed(6)} HYPE...`}
                  footerText="Please confirm the transaction in your wallet"
                />
              </View>
            </View>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <View style={styles.content}>
              <ModalHeader title="Delegation Successful!" onClose={onClose} />

              <View style={styles.body}>
                <SuccessStep
                  title=""
                  description={`Successfully delegated ${amountNum.toFixed(6)} HYPE\nYou will start earning rewards`}
                  onClose={onClose}
                />
              </View>
            </View>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <View style={styles.content}>
              <ModalHeader title="Delegation Failed" onClose={onClose} />

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


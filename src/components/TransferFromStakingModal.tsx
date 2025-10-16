import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { styles } from './styles/TransferFromStakingModal.styles';

interface TransferFromStakingModalProps {
  visible: boolean;
  onClose: () => void;
  maxAmount: number;
}

type Step = 'form' | 'confirm' | 'pending' | 'success' | 'error';

export default function TransferFromStakingModal({
  visible,
  onClose,
  maxAmount,
}: TransferFromStakingModalProps): React.JSX.Element {
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

      console.log('[Staking] Transferring from staking:', { amount: amountNum, wei });

      const result = await mainExchangeClient.cWithdraw({ wei });

      console.log('[Staking] Transfer from staking result:', result);

      setStep('success');

      setTimeout(() => {
        refetchAccount();
      }, 3000);
    } catch (err: any) {
      console.error('[Staking] Transfer from staking failed:', err);
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
              <View style={styles.header}>
                <Text style={styles.title}>Transfer to Spot</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.description}>
                  Transfer HYPE from your staking balance back to your spot balance. You can only transfer undelegated HYPE.
                </Text>

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Available in Staking:</Text>
                  <Text style={styles.balanceValue}>{maxAmount.toFixed(6)} HYPE</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={handleAmountChange}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <TouchableOpacity style={styles.maxButton} onPress={handleMaxClick}>
                      <Text style={styles.maxButtonText}>MAX</Text>
                    </TouchableOpacity>
                  </View>
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
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
              <View style={styles.header}>
                <Text style={styles.title}>Confirm Transfer</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <View style={styles.confirmSection}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Amount:</Text>
                    <Text style={styles.confirmValue}>{amountNum.toFixed(6)} HYPE</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>From:</Text>
                    <Text style={styles.confirmValue}>Staking Balance</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>To:</Text>
                    <Text style={styles.confirmValue}>Spot Balance</Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Make sure you've undelegated before transferring to spot.
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('form')}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleExecute}>
                  <Text style={styles.confirmButtonText}>Confirm Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pending Step */}
          {step === 'pending' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Processing...</Text>
              </View>

              <View style={styles.body}>
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#00FF94" />
                  <Text style={styles.statusText}>
                    Transferring {amountNum.toFixed(6)} HYPE to spot...
                  </Text>
                  <Text style={styles.statusHint}>Please confirm the transaction in your wallet</Text>
                </View>
              </View>
            </View>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Transfer Successful!</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <View style={styles.statusContainer}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.statusText}>
                    Successfully transferred {amountNum.toFixed(6)} HYPE to spot balance
                  </Text>
                  <Text style={styles.statusHint}>You can now trade or withdraw</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Transfer Failed</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <View style={styles.statusContainer}>
                  <Text style={styles.errorIcon}>✕</Text>
                  <Text style={styles.statusText}>Failed to transfer to spot</Text>
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={() => setStep('form')}>
                  <Text style={styles.confirmButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


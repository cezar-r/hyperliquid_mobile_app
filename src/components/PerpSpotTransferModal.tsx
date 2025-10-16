/**
 * Perp <-> Spot Transfer Modal - Internal USDC transfers between Perp and Spot accounts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { styles } from './styles/PerpSpotTransferModal.styles';

interface PerpSpotTransferModalProps {
  visible: boolean;
  onClose: () => void;
  perpBalance: number;
  spotBalance: number;
}

type Step = 'form' | 'confirm' | 'pending' | 'success' | 'error';

export default function PerpSpotTransferModal({
  visible,
  onClose,
  perpBalance,
  spotBalance,
}: PerpSpotTransferModalProps): React.JSX.Element {
  const { mainExchangeClient, refetchAccount } = useWallet();
  const [amount, setAmount] = useState('');
  const [toPerp, setToPerp] = useState(true); // true = Spot -> Perp, false = Perp -> Spot
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));

  const amountNum = parseFloat(amount) || 0;
  const maxAmount = toPerp ? spotBalance : perpBalance;
  const isValid = amountNum > 0 && amountNum <= maxAmount;

  useEffect(() => {
    if (visible) {
      setStep('form');
      setAmount('');
      setToPerp(true);
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

    // Check decimals (max 6 for USDC)
    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 6) {
      setError('Maximum 6 decimal places');
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
      console.log('[PerpSpotTransfer] Transferring:', {
        amount: amountNum,
        toPerp,
        direction: toPerp ? 'Spot → Perp' : 'Perp → Spot',
      });

      const result = await mainExchangeClient.usdClassTransfer({
        amount: amount,
        toPerp: toPerp,
      });

      console.log('[PerpSpotTransfer] Transfer result:', result);

      setStep('success');

      // Refetch account data after a delay
      setTimeout(() => {
        refetchAccount();
      }, 3000);
    } catch (err: any) {
      console.error('[PerpSpotTransfer] Transfer failed:', err);
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
                <Text style={styles.title}>Perp ↔ Spot Transfer</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.description}>
                  Transfer USDC between your Perpetual and Spot accounts instantly.
                </Text>

                {/* Direction Toggle */}
                <View style={styles.directionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      toPerp && styles.directionButtonActive,
                    ]}
                    onPress={() => setToPerp(true)}
                  >
                    <Text
                      style={[
                        styles.directionButtonText,
                        toPerp && styles.directionButtonTextActive,
                      ]}
                    >
                      Spot → Perp
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      !toPerp && styles.directionButtonActive,
                    ]}
                    onPress={() => setToPerp(false)}
                  >
                    <Text
                      style={[
                        styles.directionButtonText,
                        !toPerp && styles.directionButtonTextActive,
                      ]}
                    >
                      Perp → Spot
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Balance Display */}
                <View style={styles.balancesContainer}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Perp Balance:</Text>
                    <Text style={styles.balanceValue}>{perpBalance.toFixed(2)} USDC</Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Spot Balance:</Text>
                    <Text style={styles.balanceValue}>{spotBalance.toFixed(2)} USDC</Text>
                  </View>
                  <View style={[styles.balanceRow, { marginBottom: 0 }]}>
                    <Text style={styles.balanceLabel}>Available to Transfer:</Text>
                    <Text style={styles.balanceValueHighlight}>
                      {maxAmount.toFixed(2)} USDC
                    </Text>
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (USDC)</Text>
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
                    <Text style={styles.confirmValue}>{amountNum.toFixed(2)} USDC</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>From:</Text>
                    <Text style={styles.confirmValue}>
                      {toPerp ? 'Spot Account' : 'Perp Account'}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>To:</Text>
                    <Text style={styles.confirmValue}>
                      {toPerp ? 'Perp Account' : 'Spot Account'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    ✓ This is an instant internal transfer. No network fees.
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
                  <Image 
                    source={require('../../assets/blob_green.gif')} 
                    style={styles.loadingGif}
                  />
                  <Text style={styles.statusText}>
                    Transferring {amountNum.toFixed(2)} USDC
                  </Text>
                  <Text style={styles.statusHint}>
                    {toPerp ? 'From Spot to Perp' : 'From Perp to Spot'}
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
                    Successfully transferred {amountNum.toFixed(2)} USDC
                  </Text>
                  <Text style={styles.statusHint}>
                    {toPerp
                      ? 'From Spot account to Perp account'
                      : 'From Perp account to Spot account'}
                  </Text>
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
                  <Text style={styles.statusText}>Failed to transfer</Text>
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


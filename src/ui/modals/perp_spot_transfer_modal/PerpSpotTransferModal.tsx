/**
 * Perp <-> Spot Transfer Modal - Internal USDC transfers between Perp and Spot accounts
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { styles } from './styles/PerpSpotTransferModal.styles';
import { ModalHeader, InfoContainer, InfoRow, InputContainer, ConfirmStep, PendingStep, SuccessStep, ErrorStep } from '../shared/components';
import { DirectionSelector } from './components';

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
  const { mainExchangeClient, refetchAccount, account } = useWallet();
  const { state: wsState } = useWebSocket();
  const [amount, setAmount] = useState('');
  const [toPerp, setToPerp] = useState(true); // true = Spot -> Perp, false = Perp -> Spot
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));

  // Calculate USDC locked in spot BUY limit orders
  const lockedSpotUSDC = useMemo(() => {
    const openOrders = account.data?.openOrders || [];
    const spotMarkets = wsState.spotMarkets;
    
    return openOrders.reduce((locked, order) => {
      // Check if this is a spot order by matching apiName (@{index} format)
      const spotMarket = spotMarkets.find(m => m.apiName === order.coin);
      
      // Only count BUY orders (they lock USDC)
      if (spotMarket && order.side === 'B') {
        const price = parseFloat(order.limitPx);
        const size = parseFloat(order.sz);
        return locked + (price * size);
      }
      
      return locked;
    }, 0);
  }, [account.data?.openOrders, wsState.spotMarkets]);

  const amountNum = parseFloat(amount) || 0;
  // When transferring Spot → Perp, deduct locked USDC from available balance
  const availableSpotUSDC = Math.max(0, spotBalance - lockedSpotUSDC);
  const maxAmount = toPerp ? availableSpotUSDC : perpBalance;
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
              <ModalHeader title="Perp ↔ Spot Transfer" onClose={onClose} />

              <View style={styles.body}>
                <DirectionSelector toPerp={toPerp} onToggle={setToPerp} />

                <InfoContainer>
                  <InfoRow label="Perp Balance:" value={`${perpBalance.toFixed(2)} USDC`} />
                  <InfoRow label="Spot Balance:" value={`${availableSpotUSDC.toFixed(2)} USDC`} />
                  <InfoRow 
                    label="Available to Transfer:" 
                    value={`${maxAmount.toFixed(2)} USDC`}
                    isLast={true}
                    valueStyle="accent"
                  />
                </InfoContainer>

                <InputContainer
                  label="Amount (USDC)"
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
                <ConfirmStep
                  title=""
                  details={[
                    { label: 'Amount:', value: `${amountNum.toFixed(2)} USDC` },
                    { label: 'From:', value: toPerp ? 'Spot Account' : 'Perp Account' },
                    { label: 'To:', value: toPerp ? 'Perp Account' : 'Spot Account', isLast: true },
                  ]}
                  onCancel={() => setStep('form')}
                  onConfirm={handleExecute}
                  confirmText="Confirm Transfer"
                />

                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    ✓ This is an instant internal transfer. No network fees.
                  </Text>
                </View>
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
                  description={`Transferring ${amountNum.toFixed(2)} USDC`}
                  footerText={`${toPerp ? 'From Spot to Perp' : 'From Perp to Spot'}\nPlease confirm the transaction in your wallet`}
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
                  description={`Successfully transferred ${amountNum.toFixed(2)} USDC\n${toPerp ? 'From Spot account to Perp account' : 'From Perp account to Spot account'}`}
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

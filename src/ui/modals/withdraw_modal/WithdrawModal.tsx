/**
 * Withdraw Modal - USDC withdrawals from Hyperliquid to Arbitrum
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../../../contexts/WalletContext';
import { isTestnet } from '../../../lib/config';
import { getArbitrumChainForEnv } from '../../../lib/deposit';
import { styles } from './styles/WithdrawModal.styles';
import { ModalHeader, InfoContainer, InfoRow, InputContainer, PrimaryButton, InfoBox, ConfirmStep, PendingStep, SuccessStep, ErrorStep } from '../shared/components';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
}

type WithdrawStep = 'form' | 'confirm' | 'pending' | 'success' | 'error';

export default function WithdrawModal({ visible, onClose }: WithdrawModalProps): React.JSX.Element {
  const { address } = useAccount();
  const { mainExchangeClient, account, refetchAccount } = useWallet();
  
  // Environment detection
  const isMainnet = !isTestnet();
  const arbitrumChain = getArbitrumChainForEnv(isMainnet);
  const hyperliquidChain = isMainnet ? 'Mainnet' : 'Testnet';
  
  // State
  const [step, setStep] = useState<WithdrawStep>('form');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [withdrawable, setWithdrawable] = useState<string>('0.00');
  const [slideAnim] = useState(new Animated.Value(1000));

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('form');
      setAmount('');
      setDestination(address || '');
      setError(null);
      
      // Get withdrawable balance
      if (account.data?.perpMarginSummary?.withdrawable) {
        setWithdrawable(account.data.perpMarginSummary.withdrawable);
      }
      
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

  // Validate amount
  const validateAmount = useCallback((): string | null => {
    if (!amount) return 'Please enter an amount';

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 'Invalid amount';

    // Check decimals (max 6 for USDC)
    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 6) {
      return 'Maximum 6 decimal places';
    }

    // Check withdrawable balance
    const withdrawableNum = parseFloat(withdrawable);
    if (num > withdrawableNum) return 'Insufficient withdrawable balance';

    return null;
  }, [amount, withdrawable]);

  // Handle max button
  const handleMaxClick = () => {
    setAmount(withdrawable);
  };

  // Handle withdraw submission
  const handleWithdraw = async () => {
    const amountError = validateAmount();
    
    if (amountError) {
      setError(amountError);
      return;
    }

    setStep('confirm');
    setError(null);
  };

  // Execute the actual withdrawal
  const executeWithdraw = async () => {
    if (!mainExchangeClient || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('pending');
      setError(null);

      console.log('[WithdrawModal] ========== EXECUTING WITHDRAWAL ==========');
      console.log('[WithdrawModal] Amount:', amount, 'USDC');
      console.log('[WithdrawModal] Destination:', destination);
      console.log('[WithdrawModal] Hyperliquid Chain:', hyperliquidChain);
      console.log('[WithdrawModal] Arbitrum Chain:', arbitrumChain.name);
      console.log('[WithdrawModal] Using main wallet (not session key) for user-signed action');
      console.log('[WithdrawModal] ================================================');

      // Call withdraw3 via MAIN exchange client (not session key)
      // Withdrawals are user-signed actions with HyperliquidSignTransaction domain
      const result = await mainExchangeClient.withdraw3({
        destination: destination as `0x${string}`,
        amount: amount,
      });

      console.log('[WithdrawModal] ✓ Withdrawal submitted:', result);
      setStep('success');

      // Refetch account after short delay
      setTimeout(() => {
        if (refetchAccount) {
          console.log('[WithdrawModal] Refetching account to update balances...');
          refetchAccount();
        }
      }, 5000);

    } catch (err: any) {
      console.error('[WithdrawModal] Withdrawal failed:', err);
      setError(err.message || 'Withdrawal failed');
      setStep('error');
    }
  };

  // Close modal
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ModalHeader title="Withdraw USDC" onClose={handleClose} />

          <ScrollView style={styles.scrollView}>
            <View style={styles.modalBody}>
              {/* Form Step */}
              {step === 'form' && (
                <View style={styles.formStep}>
                  <InfoContainer>
                    <InfoRow 
                      label="Wallet:" 
                      value={`${address?.slice(0, 6)}...${address?.slice(-4)}`} 
                    />
                    <InfoRow 
                      label="Withdrawable:" 
                      value={`${withdrawable} USDC`}
                      isLast={true}
                      valueStyle="accent"
                    />
                  </InfoContainer>

                  <InputContainer
                    label="Amount (USDC)"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    onMaxPress={handleMaxClick}
                    autoFocus={true}
                  />

                  <InfoBox>
                    <Text style={styles.infoBoxText}>
                      Withdrawals are processed by Hyperliquid validators and typically arrive in 6-7 minutes.
                    </Text>
                  </InfoBox>

                  <InfoBox variant="fee">
                    <Text style={styles.feeBoxText}>
                      A 1 USDC fee is deducted by the Hyperliquid chain for processing withdrawals.
                    </Text>
                  </InfoBox>

                  {error && (
                    <View style={styles.errorMessage}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <PrimaryButton
                    text="Withdraw to Arbitrum"
                    onPress={handleWithdraw}
                    disabled={!amount || !!validateAmount()}
                  />
                </View>
              )}

              {/* Confirm Step */}
              {step === 'confirm' && (
                <ConfirmStep
                  title="Confirm Withdrawal"
                  details={[
                    { label: 'Amount:', value: `${amount} USDC` },
                    { label: 'From:', value: `Hyperliquid ${hyperliquidChain}` },
                    { label: 'To:', value: `${destination.slice(0, 10)}...${destination.slice(-8)}` },
                    { label: 'Network:', value: arbitrumChain.name },
                    { label: 'Est. Time:', value: '6-7 minutes' },
                    { label: 'Network Fee:', value: '1 USDC', isLast: true },
                  ]}
                  warningText={
                    <Text style={styles.warningText}>
                      <Text style={styles.warningBold}>⚠️ Important:</Text> This action will sign a withdrawal request on Hyperliquid. 
                      Validators will process your withdrawal and send funds to {arbitrumChain.name}. A 1 USDC fee will be deducted.
                    </Text>
                  }
                  onCancel={() => setStep('form')}
                  onConfirm={executeWithdraw}
                  confirmText="Confirm Withdrawal"
                />
              )}

              {/* Pending Step */}
              {step === 'pending' && (
                <PendingStep
                  title="Withdrawal Submitted"
                  description="Your withdrawal request has been signed and submitted to Hyperliquid validators."
                  infoBox={{
                    title: '⏱️ Processing',
                    text: `Validators will process your withdrawal and send ${amount} USDC to ${arbitrumChain.name}.\n\nThis typically takes 6-7 minutes.`,
                  }}
                  footerText="You can close this modal. Your withdrawal is being processed."
                />
              )}

              {/* Success Step */}
              {step === 'success' && (
                <SuccessStep
                  title="Withdrawal Submitted!"
                  description="Your withdrawal request has been submitted successfully."
                  details={[
                    { label: 'Amount:', value: `${amount} USDC` },
                    { label: 'Destination:', value: `${destination.slice(0, 10)}...${destination.slice(-8)}` },
                  ]}
                  infoBox={{
                    title: '⏱️ Processing by Validators',
                    text: `Your USDC will arrive on ${arbitrumChain.name} in approximately 6-7 minutes.\n\nYou can check your balance on ${arbitrumChain.blockExplorers[0]}`,
                  }}
                  onClose={handleClose}
                />
              )}

              {/* Error Step */}
              {step === 'error' && (
                <ErrorStep
                  title="Withdrawal Failed"
                  error={error}
                  onClose={handleClose}
                  onRetry={() => setStep('form')}
                />
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


/**
 * Withdraw Modal - USDC withdrawals from Hyperliquid to Arbitrum
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { isTestnet } from '../lib/config';
import { getArbitrumChainForEnv } from '../lib/deposit';
import { styles } from './styles/WithdrawModal.styles';
import { Color } from '../styles/colors';

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
  }, [visible, address, account.data, slideAnim]);

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

  // Destination is always the connected wallet, no validation needed

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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw USDC</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.modalBody}>
              {/* Form Step */}
              {step === 'form' && (
                <View style={styles.formStep}>
                  <View style={styles.walletInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Wallet:</Text>
                      <Text style={styles.infoValue}>
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </Text>
                    </View>
                    <View style={[styles.infoRow, styles.balanceRow]}>
                      <Text style={styles.infoLabel}>Withdrawable:</Text>
                      <Text style={styles.balanceValue}>{withdrawable} USDC</Text>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Amount (USDC)</Text>
                    <View style={styles.inputWithButton}>
                      <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        placeholderTextColor={Color.FG_3}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <TouchableOpacity style={styles.maxButton} onPress={handleMaxClick}>
                        <Text style={styles.maxButtonText}>Max</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>
                      Withdrawals are processed by Hyperliquid validators and typically arrive in 6-7 minutes.
                    </Text>
                  </View>

                  <View style={styles.feeBox}>
                    <Text style={styles.feeBoxText}>
                      A 1 USDC fee is deducted by the Hyperliquid chain for processing withdrawals.
                    </Text>
                  </View>
                  {error && (
                    <View style={styles.errorMessage}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (!amount || !!validateAmount()) && styles.primaryButtonDisabled
                    ]}
                    onPress={handleWithdraw}
                    disabled={!amount || !!validateAmount()}
                  >
                    <Text style={styles.primaryButtonText}>Withdraw to Arbitrum</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Confirm Step */}
              {step === 'confirm' && (
                <View style={styles.confirmStep}>
                  <Text style={styles.confirmTitle}>Confirm Withdrawal</Text>
                  <View style={styles.confirmationDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>{amount} USDC</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>Hyperliquid {hyperliquidChain}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>{destination.slice(0, 10)}...{destination.slice(-8)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Network:</Text>
                      <Text style={styles.detailValue}>{arbitrumChain.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Est. Time:</Text>
                      <Text style={styles.detailValue}>6-7 minutes</Text>
                    </View>
                    <View style={[styles.detailRow, { marginBottom: 0 }]}>
                      <Text style={styles.detailLabel}>Network Fee:</Text>
                      <Text style={styles.detailValue}>1 USDC</Text>
                    </View>
                  </View>
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      <Text style={styles.warningBold}>⚠️ Important:</Text> This action will sign a withdrawal request on Hyperliquid. 
                      Validators will process your withdrawal and send funds to {arbitrumChain.name}. A 1 USDC fee will be deducted.
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('form')}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonFlex} onPress={executeWithdraw}>
                      <Text style={styles.primaryButtonText}>Confirm Withdrawal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Pending Step */}
              {step === 'pending' && (
                <View style={styles.pendingStep}>
                  <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} style={styles.spinner} />
                  <Text style={styles.pendingTitle}>Withdrawal Submitted</Text>
                  <Text style={styles.pendingText}>
                    Your withdrawal request has been signed and submitted to Hyperliquid validators.
                  </Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>⏱️ Processing</Text>
                    <Text style={styles.infoBoxText}>
                      Validators will process your withdrawal and send {amount} USDC to {arbitrumChain.name}.
                      {'\n\n'}
                      This typically takes 6-7 minutes.
                    </Text>
                  </View>
                  <Text style={styles.helpText}>You can close this modal. Your withdrawal is being processed.</Text>
                </View>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <View style={styles.successStep}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Withdrawal Submitted!</Text>
                  <Text style={styles.successText}>Your withdrawal request has been submitted successfully.</Text>
                  <View style={styles.successDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>{amount} USDC</Text>
                    </View>
                    <View style={[styles.detailRow, { marginBottom: 0 }]}>
                      <Text style={styles.detailLabel}>Destination:</Text>
                      <Text style={styles.detailValue}>{destination.slice(0, 10)}...{destination.slice(-8)}</Text>
                    </View>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>⏱️ Processing by Validators</Text>
                    <Text style={styles.infoBoxText}>
                      Your USDC will arrive on {arbitrumChain.name} in approximately 6-7 minutes.
                      {'\n\n'}
                      You can check your balance on {arbitrumChain.blockExplorers[0]}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Error Step */}
              {step === 'error' && (
                <View style={styles.errorStep}>
                  <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>✕</Text>
                  </View>
                  <Text style={styles.errorTitle}>Withdrawal Failed</Text>
                  {error && (
                    <View style={styles.errorMessage}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                      <Text style={styles.secondaryButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonFlex} onPress={() => setStep('form')}>
                      <Text style={styles.primaryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


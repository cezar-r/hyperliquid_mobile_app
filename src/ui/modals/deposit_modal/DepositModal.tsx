/**
 * Deposit Modal - USDC deposits from Arbitrum to Hyperliquid
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LoadingBlob } from '../../shared/components';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { createWalletClient, custom } from 'viem';
import { useWallet } from '../../../contexts/WalletContext';
import { isTestnet } from '../../../lib/config';
import {
  getArbitrumChainForEnv,
  getBridgeAddress,
  getUsdcAddress,
  ensureArbitrumChain,
  readUsdcBalance,
  transferUsdc,
} from '../../../lib/deposit';
import { USDC } from '../../../lib/contracts';
import { styles } from './styles/DepositModal.styles';
import { ModalHeader, InfoContainer, InfoRow, InputContainer, WarningContainer } from '../shared/components';
import { DepositButton, FooterText } from './components';
import { Color } from '../../shared/styles/colors';

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
}

type DepositStep = 'form' | 'network' | 'confirm' | 'pending' | 'success' | 'error';

export default function DepositModal({ visible, onClose }: DepositModalProps): React.JSX.Element {
  const { address } = useAccount();
  const { provider } = useProvider();
  const { refetchAccount } = useWallet();
  
  // Environment detection
  const isMainnet = !isTestnet();
  const arbitrumChain = getArbitrumChainForEnv(isMainnet);
  const bridgeAddress = getBridgeAddress(isMainnet);
  const usdcAddress = getUsdcAddress(isMainnet);
  
  // State
  const [step, setStep] = useState<DepositStep>('form');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceFormatted, setBalanceFormatted] = useState('0.00');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isCorrectChain, setIsCorrectChain] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(1000));

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('form');
      setAmount('');
      setError(null);
      setTxHash(null);
      checkChainAndBalance();
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

  // Create wallet client from Reown provider
  useEffect(() => {
    if (provider && address) {
      const client = createWalletClient({
        account: address as `0x${string}`,
        transport: custom(provider as any),
      } as any);
      setWalletClient(client);
    }
  }, [provider, address]);

  // Check if wallet is on correct Arbitrum chain and fetch balance
  const checkChainAndBalance = useCallback(async () => {
    if (!walletClient || !address) return;

    try {
      // Get current chain ID
      const chainId = await walletClient.getChainId();
      setCurrentChainId(chainId);

      // Check if on correct Arbitrum chain
      const correctChain = chainId === arbitrumChain.id;
      setIsCorrectChain(correctChain);

      if (!correctChain) {
        setStep('network');
        return;
      }

      // Fetch USDC balance
      const publicClient = createPublicClient({
        chain: arbitrumChain as any,
        transport: http(arbitrumChain.rpcUrls[0]),
      });

      const bal = await readUsdcBalance(publicClient, usdcAddress, address);
      setBalance(bal);
      setBalanceFormatted(formatUnits(bal, USDC.decimals));
      setStep('form');
    } catch (err: any) {
      console.error('[DepositModal] Error checking chain/balance:', err);
      setError(err.message || 'Failed to check network or balance');
      setStep('error');
    }
  }, [walletClient, address, arbitrumChain, usdcAddress]);

  // Switch to Arbitrum chain
  const handleSwitchNetwork = async () => {
    if (!walletClient) return;

    try {
      setError(null);
      await ensureArbitrumChain(walletClient, arbitrumChain);
      // Recheck after switch
      await checkChainAndBalance();
    } catch (err: any) {
      console.error('[DepositModal] Failed to switch network:', err);
      setError(err.message || 'Failed to switch network');
    }
  };

  // Validate amount
  const validateAmount = useCallback((): string | null => {
    if (!amount) return 'Please enter an amount';

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 'Invalid amount';
    if (num < 5) return 'Minimum deposit is 5 USDC';

    // Check decimals (max 6)
    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 6) {
      return 'Maximum 6 decimal places';
    }

    // Check balance
    if (balance !== null) {
      try {
        const amountBase = parseUnits(amount, USDC.decimals);
        if (amountBase > balance) return 'Insufficient balance';
      } catch {
        return 'Invalid amount format';
      }
    }

    return null;
  }, [amount, balance]);

  // Handle max button
  const handleMaxClick = () => {
    if (balance !== null) {
      setAmount(formatUnits(balance, USDC.decimals));
    }
  };

  // Handle deposit submission
  const handleDeposit = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('confirm');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to prepare deposit');
      setStep('error');
    }
  };

  // Execute the actual deposit transaction
  const executeDeposit = async () => {
    if (!walletClient) return;

    try {
      setStep('pending');
      setError(null);

      // Parse amount to base units
      const amountBase = parseUnits(amount, USDC.decimals);

      console.log('[DepositModal] ========== EXECUTING DEPOSIT ==========');
      console.log('[DepositModal] Amount:', amount, 'USDC');
      console.log('[DepositModal] Amount (base units):', amountBase.toString());
      console.log('[DepositModal] USDC Contract:', usdcAddress);
      console.log('[DepositModal] Bridge2 Contract:', bridgeAddress);
      console.log('[DepositModal] Network:', arbitrumChain.name);
      console.log('[DepositModal] Chain ID:', arbitrumChain.id);
      console.log('[DepositModal] ================================================');

      // Execute ERC-20 transfer to Bridge2
      const hash = await transferUsdc(walletClient, usdcAddress, bridgeAddress, amountBase, arbitrumChain);
      setTxHash(hash);

      console.log('[DepositModal] ✓ Transaction submitted:', hash);

      // Create public client to wait for confirmation
      const publicClient = createPublicClient({
        chain: arbitrumChain as any,
        transport: http(arbitrumChain.rpcUrls[0]),
      });

      console.log('[DepositModal] Waiting for transaction confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });

      console.log('[DepositModal] ✓ Transaction confirmed!');
      setStep('success');

      // Start polling for balance update
      setTimeout(() => {
        if (refetchAccount) {
          console.log('[DepositModal] Refetching account to update balances...');
          refetchAccount();
        }
      }, 5000); // Wait 5 seconds then refetch

    } catch (err: any) {
      console.error('[DepositModal] Deposit failed:', err);
      setError(err.message || 'Transaction failed');
      setStep('error');
    }
  };

  // Close modal
  const handleClose = () => {
    onClose();
  };

  // Open transaction in block explorer
  const openTxLink = () => {
    if (txHash) {
      const url = `${arbitrumChain.blockExplorers[0]}/tx/${txHash}`;
      Linking.openURL(url);
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
          <ModalHeader title="Deposit USDC" onClose={handleClose} />

          <ScrollView style={styles.scrollView}>
            <View style={styles.modalBody}>
              {/* Network Step */}
              {step === 'network' && (
                <View style={styles.networkStep}>
                  <View style={[styles.infoBadge, styles.warningBadge]}>
                    <Text style={styles.infoBadgeText}>⚠️ Wrong Network</Text>
                  </View>
                  <Text style={styles.stepDescription}>
                    Switch your wallet to <Text style={{ fontWeight: '600' }}>{arbitrumChain.name}</Text> to deposit USDC.
                  </Text>
                  <View style={styles.networkInfo}>
                    <View style={styles.networkItem}>
                      <Text style={styles.networkLabel}>Current Network:</Text>
                      <Text style={styles.networkValue}>Chain ID {currentChainId}</Text>
                    </View>
                    <View style={[styles.networkItem, { marginBottom: 0 }]}>
                      <Text style={styles.networkLabel}>Required Network:</Text>
                      <Text style={styles.networkValue}>{arbitrumChain.name} (Chain ID {arbitrumChain.id})</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSwitchNetwork}>
                    <Text style={styles.primaryButtonText}>Switch to {arbitrumChain.name}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Form Step */}
              {step === 'form' && (
                <View style={styles.formStep}>
                  <InfoContainer>
                    <InfoRow label="Network:" value={arbitrumChain.name} />
                    <InfoRow 
                      label="Wallet:" 
                      value={`${address?.slice(0, 6)}...${address?.slice(-4)}`} 
                    />
                    <InfoRow 
                      label="Available:" 
                      value={`${balanceFormatted} USDC`}
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

                  <WarningContainer>
                    <Text style={styles.warningText}>
                      <Text style={styles.warningBold}>⚠️ Important:</Text> Minimum deposit is 5 USDC. 
                      Amounts less than 5 USDC will not be credited and lost forever.
                    </Text>
                  </WarningContainer>

                  {error && (
                    <View style={styles.errorMessage}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <DepositButton
                    onPress={handleDeposit}
                    disabled={!amount || !!validateAmount()}
                  />

                  <FooterText text="USDC will be transferred to Bridge2 and credited to your Hyperliquid account within ~1 minute." />
                </View>
              )}

              {/* Confirm Step */}
              {step === 'confirm' && (
                <View style={styles.confirmStep}>
                  <Text style={styles.confirmTitle}>Confirm Deposit</Text>
                  <View style={styles.confirmationDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>{amount} USDC</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>{address?.slice(0, 10)}...{address?.slice(-8)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>Bridge2 ({bridgeAddress.slice(0, 10)}...{bridgeAddress.slice(-8)})</Text>
                    </View>
                    <View style={[styles.detailRow, { marginBottom: 0 }]}>
                      <Text style={styles.detailLabel}>Network:</Text>
                      <Text style={styles.detailValue}>{arbitrumChain.name}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('form')}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonFlex} onPress={executeDeposit}>
                      <Text style={styles.primaryButtonText}>Confirm Deposit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Pending Step */}
              {step === 'pending' && (
                <View style={styles.pendingStep}>
                  <LoadingBlob />
                  <Text style={styles.pendingTitle}>Transaction Pending...</Text>
                  <Text style={styles.pendingText}>
                    Please wait for the transaction to be confirmed on {arbitrumChain.name}.
                  </Text>
                  {txHash && (
                    <TouchableOpacity onPress={openTxLink}>
                      <Text style={styles.txLink}>
                        View on {arbitrumChain.name === 'Arbitrum One' ? 'Arbiscan' : 'Arbiscan Sepolia'} →
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.helpText}>You can close this modal. The deposit will complete in the background.</Text>
                </View>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <View style={styles.successStep}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Deposit Successful!</Text>
                  <Text style={styles.successText}>Your USDC has been sent to Bridge2.</Text>
                  <View style={styles.successDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>{amount} USDC</Text>
                    </View>
                    {txHash && (
                      <TouchableOpacity onPress={openTxLink}>
                        <Text style={styles.txLink}>View Transaction →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>📥 Crediting to Hyperliquid</Text>
                    <Text style={styles.infoBoxText}>
                      Funds should appear in your Hyperliquid account within ~1 minute.
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
                  <Text style={styles.errorTitle}>Transaction Failed</Text>
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


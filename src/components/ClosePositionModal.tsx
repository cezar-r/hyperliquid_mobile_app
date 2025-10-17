/**
 * Close Position Modal - Close perp positions with slider for amount selection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice as formatPriceForOrder, formatSize as formatSizeForOrder } from '../lib/formatting';
import { styles } from './styles/ClosePositionModal.styles';
import { Color } from '../styles/colors';
import type { PerpPosition } from '../types';

interface ClosePositionModalProps {
  visible: boolean;
  onClose: () => void;
  position: PerpPosition;
  currentPrice: number;
  coin: string;
}

type CloseStep = 'form' | 'confirm' | 'pending' | 'success' | 'error';

// Helper to format numbers with commas
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function ClosePositionModal({ 
  visible, 
  onClose, 
  position,
  currentPrice,
  coin,
}: ClosePositionModalProps): React.JSX.Element {
  const { exchangeClient, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { perpMarkets } = wsState;
  
  // State
  const [step, setStep] = useState<CloseStep>('form');
  const [percentage, setPercentage] = useState(100);
  const [percentageInput, setPercentageInput] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));
  const percentageInputRef = useRef<TextInput>(null);

  // Get market info
  const market = perpMarkets.find(m => m.name === coin);
  const szDecimals = market?.szDecimals ?? 4;
  const assetIndex = market?.index ?? 0;

  // Calculate position details
  const positionSize = parseFloat(position.szi);
  const isLong = positionSize > 0;
  const entryPrice = parseFloat(position.entryPx);
  const leverage = position.leverage?.value ?? 1;
  
  // Calculate amounts based on percentage
  const tokenAmount = Math.abs(positionSize) * (percentage / 100);
  const usdValue = tokenAmount * currentPrice;
  const remainingSize = Math.abs(positionSize) - tokenAmount;
  
  // Calculate unrealized PnL for display
  const pnl = positionSize * (currentPrice - entryPrice);
  const pnlPercent = (pnl / (Math.abs(positionSize) * entryPrice)) * 100;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('form');
      setPercentage(100);
      setPercentageInput('100');
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
      // Focus on percentage input after animation
      setTimeout(() => {
        percentageInputRef.current?.focus();
      }, 300);
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Handle slider change
  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value);
    setPercentage(rounded);
    setPercentageInput(rounded.toString());
  };

  // Handle percentage input change
  const handlePercentageInputChange = (text: string) => {
    setPercentageInput(text);
    
    // Validate and update percentage
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPercentage(num);
    }
  };

  // Handle quick select buttons
  const handleQuickSelect = (value: number) => {
    setPercentage(value);
    setPercentageInput(value.toString());
  };

  // Validate form
  const validateForm = useCallback((): string | null => {
    if (percentage <= 0) return 'Please select an amount to close';
    if (percentage > 100) return 'Percentage cannot exceed 100%';
    return null;
  }, [percentage]);

  // Handle submit (go to confirm)
  const handleSubmit = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep('confirm');
    setError(null);
  };

  // Execute the close order
  const executeClose = async () => {
    if (!exchangeClient || !market) {
      setError('Wallet not connected or market not found');
      setStep('error');
      return;
    }

    setStep('pending');
    setError(null);

    try {
      // Calculate execution price with 0.1% slippage
      let executionPrice: number;
      if (isLong) {
        // Closing long: SELL at lower price
        executionPrice = currentPrice * 0.999;
      } else {
        // Closing short: BUY at higher price
        executionPrice = currentPrice * 1.001;
      }

      // Format price and size for order
      const formattedPrice = formatPriceForOrder(executionPrice, szDecimals, true);
      const formattedSize = formatSizeForOrder(tokenAmount, szDecimals, currentPrice);
      
      console.log('[ClosePositionModal] ========== CLOSING POSITION ==========');
      console.log('[ClosePositionModal] Coin:', coin);
      console.log('[ClosePositionModal] Percentage:', percentage + '%');
      console.log('[ClosePositionModal] Token Amount:', tokenAmount);
      console.log('[ClosePositionModal] USD Value:', usdValue);
      console.log('[ClosePositionModal] Position Size:', positionSize);
      console.log('[ClosePositionModal] Is Long:', isLong);
      console.log('[ClosePositionModal] Current Price:', currentPrice);
      console.log('[ClosePositionModal] Execution Price:', executionPrice);
      console.log('[ClosePositionModal] Formatted Price:', formattedPrice);
      console.log('[ClosePositionModal] Formatted Size:', formattedSize);
      console.log('[ClosePositionModal] Asset Index:', assetIndex);
      console.log('[ClosePositionModal] ================================================');

      // Build order payload
      const orderPayload = {
        orders: [{
          a: assetIndex,
          b: positionSize < 0, // If short, buy to close; if long, sell to close
          p: formattedPrice,
          s: formattedSize,
          r: true, // Reduce only
          t: {
            limit: { tif: 'Ioc' as const },
          },
        }],
        grouping: 'na' as const,
      };

      console.log('[ClosePositionModal] Order Payload:', JSON.stringify(orderPayload, null, 2));

      const result = await exchangeClient.order(orderPayload);

      console.log('[ClosePositionModal] ✓ Close order placed:', result);
      setStep('success');
      
      // Refetch account data
      setTimeout(() => refetchAccount(), 2000);
    } catch (err: any) {
      console.error('[ClosePositionModal] Failed to close position:', err);
      setError(err.message || 'Failed to close position');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'pending') {
      onClose();
    }
  };

  // Render form step
  const renderFormStep = () => (
    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
      <View style={styles.formStep}>
        {/* Position Info */}
        <View style={styles.positionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position</Text>
            <Text style={[styles.infoValue, { color: isLong ? Color.BRIGHT_ACCENT : Color.RED }]}>
              {isLong ? 'LONG' : 'SHORT'} {Math.abs(positionSize).toFixed(szDecimals)} {coin}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entry Price</Text>
            <Text style={styles.infoValue}>${formatNumber(entryPrice, 2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Price</Text>
            <Text style={styles.infoValue}>${formatNumber(currentPrice, 2)}</Text>
          </View>
          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={styles.infoLabel}>Unrealized PnL</Text>
            <Text style={[styles.infoValue, { color: pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED }]}>
              {pnl >= 0 ? '+' : ''}${formatNumber(Math.abs(pnl), 2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Percentage Input */}
        <View style={styles.sliderSection}>
          <View style={styles.percentageInputContainer}>
            <TextInput
              ref={percentageInputRef}
              style={styles.percentageInput}
              value={percentageInput}
              onChangeText={handlePercentageInputChange}
              placeholder="0"
              placeholderTextColor={Color.FG_3}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.percentageSymbol}>%</Text>
          </View>

          {/* Slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={percentage}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={Color.BRIGHT_ACCENT}
              maximumTrackTintColor={Color.BG_3}
              thumbTintColor={Color.BRIGHT_ACCENT}
            />
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            {[25, 50, 75, 100].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickSelectButton,
                  percentage === value && styles.quickSelectButtonActive,
                ]}
                onPress={() => handleQuickSelect(value)}
              >
                <Text
                  style={[
                    styles.quickSelectButtonText,
                    percentage === value && styles.quickSelectButtonTextActive,
                  ]}
                >
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Display */}
        <View style={styles.amountDisplay}>
          <View style={styles.sizeRow}>
            <Text style={styles.infoLabel}>Size</Text>
            <Text style={styles.infoValue}>
              {tokenAmount.toFixed(szDecimals)} {coin}
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (percentage <= 0 || !!validateForm()) && styles.primaryButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={percentage <= 0 || !!validateForm()}
        >
          <Text style={styles.primaryButtonText}>Market Close</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render confirm step
  const renderConfirmStep = () => {
    const executionPrice = isLong ? currentPrice * 0.999 : currentPrice * 1.001;
    
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.confirmStep}>
          <Text style={styles.confirmTitle}>Confirm Close Position</Text>
          
          <View style={styles.confirmationDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Position</Text>
              <Text style={styles.detailValue}>
                {Math.abs(positionSize).toFixed(szDecimals)} → {remainingSize.toFixed(szDecimals)} {coin}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Closing</Text>
              <Text style={styles.detailValue}>
                {tokenAmount.toFixed(szDecimals)} {coin} (${formatNumber(usdValue, 2)})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Percentage</Text>
              <Text style={styles.detailValue}>{percentage}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Side</Text>
              <Text style={[styles.detailValue, { color: isLong ? Color.RED : Color.BRIGHT_ACCENT }]}>
                {isLong ? 'SELL (close long)' : 'BUY (close short)'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Execution Price</Text>
              <Text style={styles.detailValue}>
                ${formatNumber(executionPrice, 2)} ({isLong ? '-0.1%' : '+0.1%'} slippage)
              </Text>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Text style={styles.detailLabel}>Order Type</Text>
              <Text style={styles.detailValue}>Reduce-Only IOC Limit</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              <Text style={styles.warningBold}>⚠️ Important:</Text> This will submit a reduce-only market order
              to close {percentage}% of your {coin} position.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('form')}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonFlex} onPress={executeClose}>
              <Text style={styles.primaryButtonText}>Confirm Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render pending step
  const renderPendingStep = () => (
    <View style={styles.pendingStep}>
      <Image 
        source={require('../../assets/blob_green.gif')} 
        style={styles.loadingGif}
      />
      <Text style={styles.pendingTitle}>Closing Position...</Text>
      <Text style={styles.pendingText}>
        Please wait for the transaction to complete.
      </Text>
    </View>
  );

  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.successStep}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Position Closed!</Text>
      <Text style={styles.successText}>
        Your position has been partially closed successfully.
      </Text>
      <View style={styles.successDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Closed</Text>
          <Text style={styles.detailValue}>
            {tokenAmount.toFixed(szDecimals)} {coin}
          </Text>
        </View>
        <View style={[styles.detailRow, { marginBottom: 0 }]}>
          <Text style={styles.detailLabel}>Value</Text>
          <Text style={styles.detailValue}>
            ${formatNumber(usdValue, 2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
        <Text style={styles.primaryButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  // Render error step
  const renderErrorStep = () => (
    <View style={styles.errorStep}>
      <View style={styles.errorIcon}>
        <Text style={styles.errorIconText}>✕</Text>
      </View>
      <Text style={styles.errorTitle}>Failed to Close Position</Text>
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
  );

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
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Close Position</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {step === 'form' && renderFormStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'pending' && renderPendingStep()}
            {step === 'success' && renderSuccessStep()}
            {step === 'error' && renderErrorStep()}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


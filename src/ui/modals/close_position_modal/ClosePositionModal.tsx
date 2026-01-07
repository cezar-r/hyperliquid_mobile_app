/**
 * Close Position Modal - Close perp positions with slider for amount selection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useWebSocketStore } from '../../../stores/websocketStore';
import { formatPrice as formatPriceForOrder, formatSize as formatSizeForOrder } from '../../../lib/formatting';
import { getAssetIdForMarket } from '../../../lib/markets';
import { getSkipClosePositionConfirmations } from '../../../lib/confirmations';
import { styles } from './styles/ClosePositionModal.styles';
import { Color } from '../../shared/styles/colors';
import { Slider } from '../../shared/components';
import { ModalHeader, InfoContainer, ConfirmStep, PendingStep, SuccessStep, ErrorStep } from '../shared/components';
import { PercentageInputContainer, QuickSelectButtons, SizeContainer } from './components';
import type { PerpPosition } from '../../../types';

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
  const { exchangeClient, refetchAccount, getExchangeClientForDex } = useWallet();
  const { state: wsState } = useWebSocket();
  const { perpMarkets } = wsState;
  const orderbook = useWebSocketStore(state => state.orderbook);
  
  // State
  const [step, setStep] = useState<CloseStep>('form');
  const [percentage, setPercentage] = useState(100);
  const [percentageInput, setPercentageInput] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));
  const percentageInputRef = useRef<TextInput>(null);

  // Get market info - must match both name AND dex for correct asset index
  const market = perpMarkets.find(m => m.name === coin && m.dex === (position.dex || ''));
  const szDecimals = market?.szDecimals ?? 4;
  const assetIndex = market ? getAssetIdForMarket(market) : 0;

  // Debug: log market lookup details
  console.log('[ClosePositionModal] Market lookup:', {
    coin,
    positionDex: position.dex,
    foundMarket: market ? { name: market.name, index: market.index, szDecimals: market.szDecimals, dex: market.dex } : null,
    allMatchingMarkets: perpMarkets.filter(m => m.name === coin).map(m => ({ name: m.name, index: m.index, szDecimals: m.szDecimals, dex: m.dex })),
  });

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

  // Handle submit (go to confirm or execute directly)
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    
    // Check if confirmations should be skipped
    const skipConfirmations = await getSkipClosePositionConfirmations();
    if (skipConfirmations) {
      executeClose();
    } else {
      setStep('confirm');
    }
  };

  // Execute the close order
  const executeClose = async () => {
    if (!exchangeClient || !market) {
      setError('Wallet not connected or market not found');
      setStep('error');
      return;
    }

    // Get dex-specific client for HIP-3 markets
    const client = getExchangeClientForDex(position.dex || '');
    if (!client) {
      setError('Failed to get exchange client for this market');
      setStep('error');
      return;
    }

    setStep('pending');
    setError(null);

    try {
      // Calculate execution price using orderbook best bid/ask with 10% slippage
      let executionPrice: number;
      if (isLong) {
        // Closing long: SELL - use highest bid with 10% slippage down
        if (orderbook && orderbook.levels && orderbook.levels[0]?.length > 0) {
          const highestBid = parseFloat(orderbook.levels[0][0].px);
          executionPrice = highestBid * 0.90;
          console.log('[ClosePositionModal] Using orderbook highest bid:', highestBid, '-> execution price:', executionPrice);
        } else {
          // Fallback to mid price with 10% slippage
          executionPrice = currentPrice * 0.90;
          console.log('[ClosePositionModal] Orderbook unavailable, using mid price with 10% slippage:', executionPrice);
        }
      } else {
        // Closing short: BUY - use lowest ask with 10% slippage up
        if (orderbook && orderbook.levels && orderbook.levels[1]?.length > 0) {
          const lowestAsk = parseFloat(orderbook.levels[1][0].px);
          executionPrice = lowestAsk * 1.10;
          console.log('[ClosePositionModal] Using orderbook lowest ask:', lowestAsk, '-> execution price:', executionPrice);
        } else {
          // Fallback to mid price with 10% slippage
          executionPrice = currentPrice * 1.10;
          console.log('[ClosePositionModal] Orderbook unavailable, using mid price with 10% slippage:', executionPrice);
        }
      }

      // Format price and size for order
      const formattedPrice = formatPriceForOrder(executionPrice, szDecimals, true);
      const formattedSize = formatSizeForOrder(tokenAmount, szDecimals, currentPrice);

      console.log('[ClosePositionModal] ========== CLOSING POSITION ==========');
      console.log('[ClosePositionModal] Coin:', coin);
      console.log('[ClosePositionModal] Dex:', position.dex || 'default');
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

      const result = await client.order(orderPayload);

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
        <InfoContainer>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Color.FG_3 }}>Position</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: isLong ? Color.BRIGHT_ACCENT : Color.RED }}>
              {isLong ? 'LONG' : 'SHORT'} {Math.abs(positionSize).toFixed(szDecimals)} {coin}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Color.FG_3 }}>Entry Price</Text>
            <Text style={{ fontSize: 14, color: Color.FG_1, fontWeight: '500' }}>${formatNumber(entryPrice, 2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: Color.FG_3 }}>Current Price</Text>
            <Text style={{ fontSize: 14, color: Color.FG_1, fontWeight: '500' }}>${formatNumber(currentPrice, 2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 }}>
            <Text style={{ fontSize: 14, color: Color.FG_3 }}>Unrealized PnL</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED }}>
              {pnl >= 0 ? '+' : ''}${formatNumber(Math.abs(pnl), 2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </InfoContainer>

        {/* Percentage Input & Slider */}
        <View style={styles.sliderSection}>
          <PercentageInputContainer
            value={percentageInput}
            onChangeText={handlePercentageInputChange}
            inputRef={percentageInputRef}
            autoFocus={true}
          />

          <Slider
            value={percentage}
            onValueChange={handleSliderChange}
          />

          <QuickSelectButtons
            selectedValue={percentage}
            onSelect={handleQuickSelect}
          />
        </View>

        {/* Amount Display */}
        <SizeContainer
          size={tokenAmount.toFixed(szDecimals)}
          coin={coin}
        />

        {error && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            { backgroundColor: Color.BRIGHT_ACCENT, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
            (percentage <= 0 || !!validateForm()) && { opacity: 0.5 }
          ]}
          onPress={handleSubmit}
          disabled={percentage <= 0 || !!validateForm()}
        >
          <Text style={{ color: Color.BG_2, fontSize: 16, fontWeight: '600' }}>Market Close</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render confirm step
  const renderConfirmStep = () => {
    // Calculate execution price for display using the same logic as executeClose
    let executionPrice: number;
    if (isLong) {
      if (orderbook && orderbook.levels && orderbook.levels[0]?.length > 0) {
        executionPrice = parseFloat(orderbook.levels[0][0].px) * 0.90;
      } else {
        executionPrice = currentPrice * 0.90;
      }
    } else {
      if (orderbook && orderbook.levels && orderbook.levels[1]?.length > 0) {
        executionPrice = parseFloat(orderbook.levels[1][0].px) * 1.10;
      } else {
        executionPrice = currentPrice * 1.10;
      }
    }

    return (
      <ScrollView style={styles.scrollView}>
        <ConfirmStep
          title="Confirm Close Position"
          details={[
            {
              label: 'Position',
              value: `${Math.abs(positionSize).toFixed(szDecimals)} → ${remainingSize.toFixed(szDecimals)} ${coin}`
            },
            {
              label: 'Closing',
              value: `${tokenAmount.toFixed(szDecimals)} ${coin} ($${formatNumber(usdValue, 2)})`
            },
            { label: 'Percentage', value: `${percentage}%` },
            {
              label: 'Side',
              value: isLong ? 'SELL (close long)' : 'BUY (close short)'
            },
            {
              label: 'Execution Price',
              value: `$${formatNumber(executionPrice, 2)} (${isLong ? '-10%' : '+10%'} slippage)`
            },
            { label: 'Order Type', value: 'Reduce-Only IOC Limit', isLast: true },
          ]}
          warningText={
            <Text style={{ color: '#FFFFFF' }}>
              <Text style={{ fontWeight: '700' }}>⚠️ Important:</Text>
              <Text> This will submit a reduce-only market order to close {percentage}% of your {coin} position.</Text>
            </Text>
          }
          warningVariant="error"
          onCancel={() => setStep('form')}
          onConfirm={executeClose}
          confirmText="Confirm Close"
        />
      </ScrollView>
    );
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
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <ModalHeader title="Close Position" onClose={handleClose} />

          <View style={styles.modalBody}>
            {step === 'form' && renderFormStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'pending' && (
              <PendingStep
                title="Closing Position..."
                description="Please wait for the transaction to complete."
              />
            )}
            {step === 'success' && (
              <SuccessStep
                title="Position Closed!"
                description="Your position has been partially closed successfully."
                details={[
                  { label: 'Closed', value: `${tokenAmount.toFixed(szDecimals)} ${coin}` },
                  { label: 'Value', value: `$${formatNumber(usdValue, 2)}` },
                ]}
                onClose={handleClose}
              />
            )}
            {step === 'error' && (
              <ErrorStep
                title="Failed to Close Position"
                error={error}
                onClose={handleClose}
                onRetry={() => setStep('form')}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


/**
 * TP/SL Edit Modal - Edit take-profit and stop-loss orders for perp positions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { formatPrice, formatSize } from '../../../lib/formatting';
import { getAssetIdForMarket } from '../../../lib/markets';
import { styles } from './styles/TPSLEditModal.styles';
import { Color } from '../../shared/styles/colors';
import type { PerpPosition } from '../../../types';
import { ModalHeader, InfoContainer, InfoRow, ActionButtons, ConfirmStep, PendingStep, SuccessStep, ErrorStep } from '../shared/components';
import type { DetailRowData } from '../shared/components';
import { TPSLInputField } from './components';

interface TPSLEditModalProps {
  visible: boolean;
  onClose: () => void;
  position: PerpPosition;
  currentPrice: number;
}

type TPSLStep = 'form' | 'confirm' | 'processing' | 'success' | 'error';

export default function TPSLEditModal({ 
  visible, 
  onClose, 
  position,
  currentPrice,
}: TPSLEditModalProps): React.JSX.Element {
  const { exchangeClient, refetchAccount, getExchangeClientForDex } = useWallet();
  const { state: wsState } = useWebSocket();
  const { perpMarkets } = wsState;

  // State
  const [step, setStep] = useState<TPSLStep>('form');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));
  const tpInputRef = useRef<TextInput>(null);

  // Get market info - must match both name AND dex for correct asset index
  const market = perpMarkets.find(m => m.name === position.coin && m.dex === (position.dex || ''));
  const szDecimals = market?.szDecimals ?? 4;
  // Use correct asset ID (handles HIP-3 formula)
  const assetIndex = market ? getAssetIdForMarket(market) : 0;

  // Calculate position direction
  const positionSize = parseFloat(position.szi);
  const isLong = positionSize > 0;
  const entryPrice = parseFloat(position.entryPx);
  const leverage = position.leverage?.value ?? 1;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('form');
      setTpPrice(position.tpPrice?.toString() || '');
      setSlPrice(position.slPrice?.toString() || '');
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
      // Focus on TP input after animation
      setTimeout(() => {
        tpInputRef.current?.focus();
      }, 300);
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Calculate percentage gains/losses (multiplied by leverage)
  const tpPercent = tpPrice ? 
    (isLong ? 
      ((parseFloat(tpPrice) - entryPrice) / entryPrice) * 100 * leverage : 
      ((entryPrice - parseFloat(tpPrice)) / entryPrice) * 100 * leverage
    ) : 0;
  
  const slPercent = slPrice ? 
    (isLong ? 
      ((parseFloat(slPrice) - entryPrice) / entryPrice) * 100 * leverage : 
      ((entryPrice - parseFloat(slPrice)) / entryPrice) * 100 * leverage
    ) : 0;

  // Validate TP/SL prices
  const validatePrices = (): string | null => {
    const tpPriceNum = tpPrice ? parseFloat(tpPrice) : null;
    const slPriceNum = slPrice ? parseFloat(slPrice) : null;

    if (tpPriceNum !== null) {
      if (isNaN(tpPriceNum) || tpPriceNum <= 0) {
        return 'Invalid take profit price';
      }
      if (isLong && tpPriceNum <= entryPrice) {
        return 'Take profit must be above entry price for long positions';
      }
      if (!isLong && tpPriceNum >= entryPrice) {
        return 'Take profit must be below entry price for short positions';
      }
    }

    if (slPriceNum !== null) {
      if (isNaN(slPriceNum) || slPriceNum <= 0) {
        return 'Invalid stop loss price';
      }
      if (isLong && slPriceNum >= entryPrice) {
        return 'Stop loss must be below entry price for long positions';
      }
      if (!isLong && slPriceNum <= entryPrice) {
        return 'Stop loss must be above entry price for short positions';
      }
    }

    return null;
  };

  // Handle submit
  const handleSubmit = () => {
    const validationError = validatePrices();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep('confirm');
    setError(null);
  };

  // Handle confirm
  const handleConfirm = async () => {
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

    setStep('processing');
    setError(null);

    try {
      // Cancel existing TP/SL orders first
      const cancels = [];
      if (position.tpOrderId) cancels.push({ a: assetIndex, o: position.tpOrderId });
      if (position.slOrderId) cancels.push({ a: assetIndex, o: position.slOrderId });

      if (cancels.length > 0) {
        await client.cancel({ cancels });
        console.log('[TPSLEditModal] ✓ Existing TP/SL orders canceled');
      }

      // Place new TP order if specified
      if (tpPrice) {
        const tpPriceNum = parseFloat(tpPrice);
        const formattedTPPrice = formatPrice(tpPriceNum, szDecimals);
        const formattedSize = formatSize(Math.abs(positionSize), szDecimals, currentPrice);

        await client.order({
          orders: [{
            a: assetIndex,
            b: !isLong, // Opposite side to close position
            p: formattedTPPrice,
            s: formattedSize,
            r: true, // Reduce-only
            t: {
              trigger: {
                triggerPx: formattedTPPrice,
                isMarket: true,
                tpsl: 'tp' as const,
              },
            },
          }],
          grouping: 'positionTpsl' as const,
        });
        console.log('[TPSLEditModal] ✓ TP order placed');
      }

      // Place new SL order if specified
      if (slPrice) {
        const slPriceNum = parseFloat(slPrice);
        const formattedSLPrice = formatPrice(slPriceNum, szDecimals);
        const formattedSize = formatSize(Math.abs(positionSize), szDecimals, currentPrice);

        await client.order({
          orders: [{
            a: assetIndex,
            b: !isLong, // Opposite side to close position
            p: formattedSLPrice,
            s: formattedSize,
            r: true, // Reduce-only
            t: {
              trigger: {
                triggerPx: formattedSLPrice,
                isMarket: true,
                tpsl: 'sl' as const,
              },
            },
          }],
          grouping: 'positionTpsl' as const,
        });
        console.log('[TPSLEditModal] ✓ SL order placed');
      }

      setStep('success');
      setTimeout(() => {
        refetchAccount();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[TPSLEditModal] Failed to update TP/SL:', err);
      setError(err.message || 'Failed to update TP/SL orders');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      onClose();
    }
  };

  const renderFormStep = () => (
    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
      <View style={styles.formContent}>
        {/* Position Info */}
        <InfoContainer>
          <InfoRow label="Coin" value={position.coin} />
          <InfoRow 
            label="Position" 
            value={`${positionSize.toFixed(szDecimals)} ${position.coin}`}
          />
          <InfoRow label="Entry Price" value={`$${entryPrice.toFixed(2)}`} />
          <InfoRow label="Mark Price" value={`$${currentPrice.toFixed(2)}`} isLast />
        </InfoContainer>

        {/* Take Profit Input */}
        <TPSLInputField
          label="Take Profit Price"
          value={tpPrice}
          onChangeText={setTpPrice}
          percentChange={tpPercent}
          inputRef={tpInputRef}
          returnKeyType="next"
        />

        {/* Stop Loss Input */}
        <TPSLInputField
          label="Stop Loss Price"
          value={slPrice}
          onChangeText={setSlPrice}
          percentChange={slPercent}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
            <Text style={styles.confirmButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderConfirmStep = () => {
    const details: DetailRowData[] = [
      {
        label: 'Position',
        value: `${positionSize.toFixed(szDecimals)} ${position.coin}`,
      },
    ];

    if (tpPrice) {
      details.push({
        label: 'Take Profit',
        value: `$${parseFloat(tpPrice).toFixed(2)}`,
      });
    }

    if (slPrice) {
      details.push({
        label: 'Stop Loss',
        value: `$${parseFloat(slPrice).toFixed(2)}`,
        isLast: true,
      });
    }

    return (
      <ConfirmStep
        title="Confirm TP/SL Update"
        details={details}
        warningText={
          <Text style={{ fontSize: 12, color: Color.FG_3, textAlign: 'center', lineHeight: 18 }}>
            Existing TP/SL orders will be canceled and replaced with new ones.
          </Text>
        }
        warningVariant="info"
        onCancel={() => setStep('form')}
        onConfirm={handleConfirm}
        confirmText="Confirm"
      />
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
          <ModalHeader title="Edit TP/SL" onClose={handleClose} />

          <View style={styles.modalBody}>
            {step === 'form' && renderFormStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'processing' && (
              <PendingStep
                title="Updating TP/SL..."
                description="Please wait while we update your orders"
              />
            )}
            {step === 'success' && (
              <SuccessStep
                title="Success!"
                description="TP/SL orders have been updated"
                onClose={onClose}
              />
            )}
            {step === 'error' && (
              <ErrorStep
                title="Error"
                error={error}
                onClose={onClose}
                onRetry={() => setStep('form')}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}



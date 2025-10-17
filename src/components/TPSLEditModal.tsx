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
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice, formatSize } from '../lib/formatting';
import { styles } from './styles/TPSLEditModal.styles';
import { Color } from '../styles/colors';
import type { PerpPosition } from '../types';

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
  const { exchangeClient, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { perpMarkets } = wsState;
  
  // State
  const [step, setStep] = useState<TPSLStep>('form');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(1000));
  const tpInputRef = useRef<TextInput>(null);

  // Get market info
  const market = perpMarkets.find(m => m.name === position.coin);
  const szDecimals = market?.szDecimals ?? 4;
  const assetIndex = market?.index ?? 0;

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

    setStep('processing');
    setError(null);

    try {
      // Cancel existing TP/SL orders first
      const cancels = [];
      if (position.tpOrderId) cancels.push({ a: assetIndex, o: position.tpOrderId });
      if (position.slOrderId) cancels.push({ a: assetIndex, o: position.slOrderId });

      if (cancels.length > 0) {
        await exchangeClient.cancel({ cancels });
        console.log('[TPSLEditModal] ✓ Existing TP/SL orders canceled');
      }

      // Place new TP order if specified
      if (tpPrice) {
        const tpPriceNum = parseFloat(tpPrice);
        const formattedTPPrice = formatPrice(tpPriceNum, szDecimals);
        const formattedSize = formatSize(Math.abs(positionSize), szDecimals, currentPrice);
        
        await exchangeClient.order({
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
        
        await exchangeClient.order({
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
        <View style={styles.positionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coin</Text>
            <Text style={styles.infoValue}>{position.coin}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position</Text>
            <Text style={[styles.infoValue, { color: isLong ? Color.BRIGHT_ACCENT : Color.RED }]}>
              {positionSize.toFixed(szDecimals)} {position.coin}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entry Price</Text>
            <Text style={styles.infoValue}>${entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mark Price</Text>
            <Text style={styles.infoValue}>${currentPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Take Profit */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Take Profit Price</Text>
            <View style={styles.percentBadgeContainer}>
              {tpPercent !== 0 && (
                <View style={[styles.percentBadge, { backgroundColor: tpPercent > 0 ? Color.BRIGHT_ACCENT + '20' : Color.RED + '20' }]}>
                  <Text style={[styles.percentText, { color: tpPercent > 0 ? Color.BRIGHT_ACCENT : Color.RED }]}>
                    {tpPercent > 0 ? '+' : ''}{tpPercent.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TextInput
            ref={tpInputRef}
            style={styles.input}
            value={tpPrice}
            onChangeText={setTpPrice}
            placeholder="Optional"
            placeholderTextColor={Color.FG_3}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
        </View>

        {/* Stop Loss */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Stop Loss Price</Text>
            <View style={styles.percentBadgeContainer}>
              {slPercent !== 0 && (
                <View style={[styles.percentBadge, { backgroundColor: slPercent > 0 ? Color.BRIGHT_ACCENT + '20' : Color.RED + '20' }]}>
                  <Text style={[styles.percentText, { color: slPercent > 0 ? Color.BRIGHT_ACCENT : Color.RED }]}>
                    {slPercent > 0 ? '+' : ''}{slPercent.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TextInput
            style={styles.input}
            value={slPrice}
            onChangeText={setSlPrice}
            placeholder="Optional"
            placeholderTextColor={Color.FG_3}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

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

  const renderConfirmStep = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmTitle}>Confirm TP/SL Update</Text>
        
        <View style={styles.confirmDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Position</Text>
            <Text style={styles.detailValue}>
              {positionSize.toFixed(szDecimals)} {position.coin}
            </Text>
          </View>
          
          {tpPrice && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Take Profit</Text>
              <Text style={[styles.detailValue, { color: Color.BRIGHT_ACCENT }]}>
                ${parseFloat(tpPrice).toFixed(2)}
              </Text>
            </View>
          )}
          
          {slPrice && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stop Loss</Text>
              <Text style={[styles.detailValue, { color: Color.RED }]}>
                ${parseFloat(slPrice).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.confirmNote}>
          Existing TP/SL orders will be canceled and replaced with new ones.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('form')}>
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderProcessingStep = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color={Color.BRIGHT_ACCENT} />
      <Text style={styles.statusTitle}>Updating TP/SL...</Text>
      <Text style={styles.statusText}>Please wait while we update your orders</Text>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.successIcon}>✓</Text>
      <Text style={styles.statusTitle}>Success!</Text>
      <Text style={styles.statusText}>TP/SL orders have been updated</Text>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.errorIcon}>✕</Text>
      <Text style={styles.statusTitle}>Error</Text>
      <Text style={styles.statusText}>{error || 'Failed to update TP/SL orders'}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={() => setStep('form')}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Edit TP/SL</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {step === 'form' && renderFormStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'processing' && renderProcessingStep()}
            {step === 'success' && renderSuccessStep()}
            {step === 'error' && renderErrorStep()}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


/**
 * Spot Order Ticket Component
 * Interface for placing spot limit and market orders
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatSize, floatToWire } from '../lib/formatting';
import { styles } from './styles/OrderTicket.styles';
import Color from '../styles/colors';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface SpotOrderTicketProps {
  visible: boolean;
  onClose: () => void;
  defaultSide?: OrderSide;
}

export default function SpotOrderTicket({ visible, onClose, defaultSide }: SpotOrderTicketProps): React.JSX.Element {
  const { exchangeClient, account, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { selectedCoin, prices, spotMarkets, orderbook } = wsState;

  const coin = selectedCoin || '';
  const currentPrice = prices[coin];
  
  // Get spot asset info
  const assetInfo = useMemo(() => {
    console.log('[SpotOrderTicket] ========== ASSET INFO LOOKUP ==========');
    console.log('[SpotOrderTicket] Looking for coin:', coin);
    console.log('[SpotOrderTicket] Available spot markets:', spotMarkets.length);
    
    const market = spotMarkets.find(m => m.name === coin);
    
    console.log('[SpotOrderTicket] Market found:', !!market);
    if (market) {
      console.log('[SpotOrderTicket] ✓ Market name:', market.name);
      console.log('[SpotOrderTicket] ✓ Universe Index (for orders):', market.index);
      console.log('[SpotOrderTicket] ✓ Base/Quote Tokens:', market.tokens);
      console.log('[SpotOrderTicket] ✓ Size Decimals:', market.szDecimals);
    } else {
      console.error('[SpotOrderTicket] ❌ MARKET NOT FOUND!');
    }
    console.log('[SpotOrderTicket] =============================================');
    
    return {
      index: market?.index ?? 0,
      szDecimals: market?.szDecimals ?? 0,
    };
  }, [coin, spotMarkets]);
  
  // Get USDC balance
  const usdcBalance = useMemo(() => {
    const spotBalances = account.data?.spotBalances || [];
    const usdc = spotBalances.find((b: any) => b.coin === 'USDC');
    return parseFloat(usdc?.total || '0');
  }, [account.data?.spotBalances]);
  
  // Get token balance (extract base token from pair name like "PURR/USDC" -> "PURR")
  const tokenBalance = useMemo(() => {
    const spotBalances = account.data?.spotBalances || [];
    const baseToken = coin.split('/')[0];
    const token = spotBalances.find((b: any) => b.coin === baseToken);
    console.log('[SpotOrderTicket] Looking for token:', baseToken, 'in balances. Found:', token);
    return parseFloat(token?.total || '0');
  }, [account.data?.spotBalances, coin]);
  
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [sizePercent, setSizePercent] = useState(0);
  const [tif, setTif] = useState<TimeInForce>('Gtc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Set default side when modal opens
  useEffect(() => {
    if (visible && defaultSide) {
      setSide(defaultSide);
    }
  }, [visible, defaultSide]);

  // Load order type preference
  useEffect(() => {
    const loadOrderTypePreference = async () => {
      try {
        const savedOrderType = await AsyncStorage.getItem('hl_order_type');
        console.log('[SpotOrderTicket] Loading saved order type from storage:', savedOrderType);
        
        if (savedOrderType) {
          const type = savedOrderType as OrderType;
          setOrderType(type);
          setTif(type === 'market' ? 'Ioc' : 'Gtc');
        } else {
          console.log('[SpotOrderTicket] No saved order type, defaulting to market');
          setOrderType('market');
          setTif('Ioc');
        }
      } catch (err) {
        console.error('[SpotOrderTicket] Failed to load order type:', err);
        setOrderType('market');
        setTif('Ioc');
      }
    };
    
    if (visible) {
      loadOrderTypePreference();
    }
  }, [visible]);

  // Load side preference
  useEffect(() => {
    const loadSidePreference = async () => {
      try {
        const savedSide = await AsyncStorage.getItem('hl_order_side');
        if (savedSide && !defaultSide) setSide(savedSide as OrderSide);
      } catch (err) {
        console.error('[SpotOrderTicket] Failed to load side:', err);
      }
    };
    
    if (visible && coin) {
      loadSidePreference();
    }
  }, [visible, coin, defaultSide]);

  // Save preferences
  useEffect(() => {
    if (visible && side) {
      AsyncStorage.setItem('hl_order_side', side);
    }
  }, [side, visible]);
  
  useEffect(() => {
    if (orderType && orderType !== null) {
      console.log('[SpotOrderTicket] Saving order type to storage:', orderType);
      AsyncStorage.setItem('hl_order_type', orderType);
    }
  }, [orderType]);

  // Auto-fill price for market orders using orderbook
  const getMarketPrice = () => {
    if (orderbook && orderbook.levels) {
      const asks = orderbook.levels[1];
      const bids = orderbook.levels[0];
      
      if (side === 'buy' && asks.length > 0) {
        const lowestAsk = asks[0].px;
        console.log('[SpotOrderTicket] Buy market price from orderbook (lowest ask):', lowestAsk);
        return lowestAsk;
      } else if (side === 'sell' && bids.length > 0) {
        const highestBid = bids[0].px;
        console.log('[SpotOrderTicket] Sell market price from orderbook (highest bid):', highestBid);
        return highestBid;
      }
    }
    
    if (!currentPrice) {
      return '';
    }

    const midPrice = parseFloat(currentPrice);
    
    if (side === 'buy') {
      const marketPrice = (midPrice * 1.01).toString();
      console.log('[SpotOrderTicket] Buy market price (fallback):', marketPrice);
      return marketPrice;
    } else {
      const marketPrice = (midPrice * 0.99).toString();
      console.log('[SpotOrderTicket] Sell market price (fallback):', marketPrice);
      return marketPrice;
    }
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'market') {
      setTif('Ioc');
      setPrice(getMarketPrice());
    } else {
      setTif('Gtc');
      setPrice(currentPrice || '');
    }
  };

  // Calculate cost/proceeds
  const orderStats = useMemo(() => {
    const p = parseFloat(price) || 0;
    const s = parseFloat(size) || 0;
    
    if (!p || !s) {
      return {
        cost: 0,
        costDisplay: '0.00',
      };
    }
    
    const usdAmount = p * s;
    
    return {
      cost: usdAmount,
      costDisplay: usdAmount.toFixed(2),
    };
  }, [price, size]);

  // Handle slider change
  const handleSizePercentChange = (percent: number) => {
    setSizePercent(percent);
    
    if (side === 'buy') {
      const p = parseFloat(price || currentPrice || '0');
      if (p > 0) {
        // For spot, don't format the price since it comes directly from orderbook
        // Just use the raw price value for calculation
        const usdToSpend = usdcBalance * (percent / 100);
        const tokenAmount = usdToSpend / p;
        setSize(tokenAmount.toFixed(assetInfo.szDecimals));
      }
    } else {
      const tokenAmount = tokenBalance * (percent / 100);
      setSize(tokenAmount.toFixed(assetInfo.szDecimals));
    }
  };

  const handleSizeChange = (value: string) => {
    setSize(value);
    setSizePercent(0);
  };

  const handleSubmit = () => {
    setError(null);
    
    if (!price || !size) {
      setError('Price and size required');
      return;
    }
    
    const priceValue = parseFloat(price);
    const sizeValue = parseFloat(size);
    
    if (isNaN(priceValue) || isNaN(sizeValue) || priceValue <= 0 || sizeValue <= 0) {
      setError('Invalid price or size');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const priceValue = parseFloat(price);
    const sizeValue = parseFloat(size);

    if (!priceValue || !sizeValue) {
      setError('Price and size required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowConfirmation(false);

    try {
      console.log('[SpotOrderTicket] ========== PRE-FORMAT DEBUG ==========');
      console.log('[SpotOrderTicket] Coin:', coin);
      console.log('[SpotOrderTicket] Asset Index (universe):', assetInfo.index);
      console.log('[SpotOrderTicket] szDecimals:', assetInfo.szDecimals);
      console.log('[SpotOrderTicket] Raw Price Value:', priceValue);
      console.log('[SpotOrderTicket] Raw Token Size:', sizeValue);
      console.log('[SpotOrderTicket] Side:', side);
      console.log('[SpotOrderTicket] Order Type:', orderType);
      console.log('[SpotOrderTicket] TIF:', tif);
      console.log('[SpotOrderTicket] ================================================');

      // For spot, use price AS-IS from input/orderbook (NO formatting!)
      // Reference web app line 225: const formattedPrice = price;
      const formattedPrice = price; // Use exact price string, don't format
      const formattedSize = formatSize(sizeValue, assetInfo.szDecimals, priceValue);

      console.log('[SpotOrderTicket] ========== POST-FORMAT DEBUG ==========');
      console.log('[SpotOrderTicket] Formatted Price:', formattedPrice);
      console.log('[SpotOrderTicket] Formatted Size:', formattedSize);
      console.log('[SpotOrderTicket] ================================================');

      const finalTif = orderType === 'market' ? 'Ioc' : tif;

      // CRITICAL: For spot, asset ID = 10000 + universe index
      const spotAssetId = 10000 + assetInfo.index;
      
      const orderPayload = {
        orders: [{
          a: spotAssetId,
          b: side === 'buy',
          p: formattedPrice,
          s: formattedSize,
          r: false,
          t: {
            limit: { tif: finalTif },
          },
        }],
        grouping: 'na' as const,
      };

      console.log('[SpotOrderTicket] ========== PLACING SPOT ORDER ==========');
      console.log('[SpotOrderTicket] Coin:', coin);
      console.log('[SpotOrderTicket] Universe Index:', assetInfo.index);
      console.log('[SpotOrderTicket] Spot Asset ID (10000 + universe):', spotAssetId);
      console.log('[SpotOrderTicket] Side:', side === 'buy' ? 'BUY' : 'SELL');
      console.log('[SpotOrderTicket] Order Type:', orderType?.toUpperCase());
      console.log('[SpotOrderTicket] TIF (final):', finalTif);
      console.log('[SpotOrderTicket] Full Payload:', JSON.stringify(orderPayload, null, 2));
      console.log('[SpotOrderTicket] ================================================');

      const result = await exchangeClient.order(orderPayload);

      console.log('[SpotOrderTicket] ========== ORDER RESULT ==========');
      console.log('[SpotOrderTicket] ✓ Spot order placed successfully!');
      console.log('[SpotOrderTicket] Result:', JSON.stringify(result, null, 2));
      console.log('[SpotOrderTicket] ================================================');
      
      setTimeout(() => refetchAccount(), 2000);

      setSize('');
      setSizePercent(0);
      if (orderType === 'limit') {
        setPrice('');
      }

      Alert.alert('Success', `${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      onClose();
    } catch (err: any) {
      console.error('[SpotOrderTicket] ========== ORDER ERROR ==========');
      console.error('[SpotOrderTicket] Full error object:', err);
      console.error('[SpotOrderTicket] Error message:', err.message);
      console.error('[SpotOrderTicket] ================================================');
      
      setError(err.message || 'Failed to place order');
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update market order price when side, currentPrice, or orderbook changes
  useEffect(() => {
    if (orderType === 'market') {
      const marketPrice = getMarketPrice();
      if (marketPrice) {
        setPrice(marketPrice);
      }
    }
  }, [orderType, side, currentPrice, orderbook]);

  if (!coin || orderType === null) {
    return <View />;
  }

  if (spotMarkets.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={{ color: Color.FG_1, padding: 20, textAlign: 'center' }}>
                Loading spot markets...
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* Side Selector */}
            <View style={styles.sideSelector}>
              <TouchableOpacity
                style={[styles.sideButton, side === 'buy' && styles.sideButtonBuyActive]}
                onPress={() => setSide('buy')}
              >
                <Text style={[styles.sideButtonText, side === 'buy' && styles.sideButtonTextBuy]}>
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideButton, side === 'sell' && styles.sideButtonSellActive]}
                onPress={() => setSide('sell')}
              >
                <Text style={[styles.sideButtonText, side === 'sell' && styles.sideButtonTextSell]}>
                  Sell
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order Type */}
            <View style={styles.orderTypeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, orderType === 'limit' && styles.typeButtonActive]}
                onPress={() => handleOrderTypeChange('limit')}
              >
                <Text style={[styles.typeButtonText, orderType === 'limit' && styles.typeButtonTextActive]}>
                  Limit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, orderType === 'market' && styles.typeButtonActive]}
                onPress={() => handleOrderTypeChange('market')}
              >
                <Text style={[styles.typeButtonText, orderType === 'market' && styles.typeButtonTextActive]}>
                  Market
                </Text>
              </TouchableOpacity>
            </View>

            {/* Price Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Text style={styles.inputLabelText}>Price (USDC)</Text>
                {orderType === 'market' && <Text style={styles.inputLabelBadge}>~Market</Text>}
              </View>
              <TextInput
                style={[styles.textInput, orderType === 'market' && styles.textInputDisabled]}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={Color.FG_3}
                keyboardType="decimal-pad"
                editable={orderType !== 'market'}
              />
              {currentPrice && orderType === 'limit' && (
                <TouchableOpacity style={styles.useMarketButton} onPress={() => setPrice(currentPrice)}>
                  <Text style={styles.useMarketButtonText}>
                    Use Market: ${currentPrice}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Size Input with Slider */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Text style={styles.inputLabelText}>Size ({coin.split('/')[0]})</Text>
                {sizePercent > 0 && <Text style={styles.inputLabelBadge}>{sizePercent}% of balance</Text>}
              </View>
              <TextInput
                style={styles.textInput}
                value={size}
                onChangeText={handleSizeChange}
                placeholder="0.0000"
                placeholderTextColor={Color.FG_3}
                keyboardType="decimal-pad"
              />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={sizePercent}
                onValueChange={handleSizePercentChange}
                minimumTrackTintColor={Color.BRIGHT_ACCENT}
                maximumTrackTintColor={Color.BG_3}
                thumbTintColor={Color.BRIGHT_ACCENT}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>0%</Text>
                <Text style={styles.sliderLabelText}>25%</Text>
                <Text style={styles.sliderLabelText}>50%</Text>
                <Text style={styles.sliderLabelText}>75%</Text>
                <Text style={styles.sliderLabelText}>100%</Text>
              </View>
            </View>

            {/* Advanced Options */}
            {orderType === 'limit' && (
              <View style={styles.advancedOptions}>
                <View style={styles.tifSelector}>
                  <Text style={styles.pickerLabel}>Time in Force</Text>
                  <Picker
                    selectedValue={tif}
                    onValueChange={(value) => setTif(value as TimeInForce)}
                    style={styles.picker}
                  >
                    <Picker.Item label="GTC (Good till Cancel)" value="Gtc" />
                    <Picker.Item label="IOC (Immediate or Cancel)" value="Ioc" />
                    <Picker.Item label="ALO (Add Liquidity Only)" value="Alo" />
                  </Picker>
                </View>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {side === 'buy' ? 'USDC Balance:' : `${coin.split('/')[0]} Balance:`}
                </Text>
                <Text style={styles.summaryValue}>
                  {side === 'buy' ? `$${usdcBalance.toFixed(2)}` : `${tokenBalance.toFixed(4)}`}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Text style={styles.summaryLabel}>{side === 'buy' ? 'Cost:' : 'Proceeds:'}</Text>
                <Text style={styles.summaryValue}>${orderStats.costDisplay}</Text>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorMessage}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                side === 'buy' ? styles.submitButtonBuy : styles.submitButtonSell,
                (isSubmitting ||
                  !price ||
                  !size ||
                  !exchangeClient ||
                  (side === 'buy' && orderStats.cost > usdcBalance) ||
                  (side === 'sell' && parseFloat(size) > tokenBalance)) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                !price ||
                !size ||
                !exchangeClient ||
                (side === 'buy' && orderStats.cost > usdcBalance) ||
                (side === 'sell' && parseFloat(size) > tokenBalance)
              }
            >
              {isSubmitting ? (
                <ActivityIndicator color={Color.FG_1} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {side === 'buy' && orderStats.cost > usdcBalance
                    ? 'Insufficient USDC'
                    : side === 'sell' && parseFloat(size) > tokenBalance
                    ? `Insufficient ${coin.split('/')[0]}`
                    : `${side === 'buy' ? 'Buy' : 'Sell'} ${coin.split('/')[0]}`}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <Modal visible={showConfirmation} transparent={true} animationType="fade" onRequestClose={() => setShowConfirmation(false)}>
            <TouchableOpacity
              style={styles.confirmationOverlay}
              activeOpacity={1}
              onPress={() => setShowConfirmation(false)}
            >
              <TouchableOpacity style={styles.confirmationModal} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.confirmationTitle}>Confirm Spot Order</Text>
                <View style={styles.confirmDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Market:</Text>
                    <Text style={styles.detailValue}>{coin}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Side:</Text>
                    <Text style={[styles.detailValue, side === 'buy' ? styles.detailValueBuy : styles.detailValueSell]}>
                      {side === 'buy' ? 'BUY' : 'SELL'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{orderType?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>${price}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>
                      {size} {coin.split('/')[0]}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>{side === 'buy' ? 'Total Cost:' : 'Total Proceeds:'}</Text>
                    <Text style={styles.detailValue}>${orderStats.costDisplay}</Text>
                  </View>
                </View>
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmation(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      side === 'buy' ? styles.confirmButtonBuy : styles.confirmButtonSell,
                      isSubmitting && styles.confirmButtonDisabled,
                    ]}
                    onPress={handleConfirmOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={Color.FG_1} size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm Order</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}


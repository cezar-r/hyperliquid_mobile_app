/**
 * Order Ticket Component
 * Interface for placing perp limit and market orders
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { formatPrice, formatSize, formatWithCommas } from '../lib/formatting';
import { styles } from './styles/OrderTicket.styles';
import Color from '../styles/colors';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface OrderTicketProps {
  visible: boolean;
  onClose: () => void;
  defaultSide?: OrderSide;
}

export default function OrderTicket({ visible, onClose, defaultSide }: OrderTicketProps): React.JSX.Element {
  const { exchangeClient, account, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { selectedCoin, prices, perpMarkets } = wsState;

  const coin = selectedCoin || '';
  const currentPrice = prices[coin];
  
  // Get tradeable balance - use withdrawable from API if available
  const tradeableBalance = useMemo(() => {
    const withdrawable = account.data?.perpMarginSummary?.withdrawable;
    
    // If withdrawable is available, use it directly (this is the true tradeable amount from Hyperliquid)
    if (withdrawable) {
      const amount = parseFloat(withdrawable);
      console.log('[OrderTicket] Using withdrawable from API:', amount);
      return amount;
    }
    
    // Fallback: Calculate manually (shouldn't be needed with withdrawable)
    const accountValue = account.data?.perpMarginSummary?.accountValue;
    const marginUsed = account.data?.perpMarginSummary?.totalMarginUsed;
    const openOrders = account.data?.openOrders || [];
    
    if (!accountValue) return 0;
    
    const total = parseFloat(accountValue);
    const used = parseFloat(marginUsed || '0');
    
    // Calculate total margin locked in open limit orders
    const openOrdersMargin = openOrders.reduce((sum: number, order: any) => {
      const price = parseFloat(order.limitPx || '0');
      const size = parseFloat(order.sz || '0');
      const notionalValue = price * size;
      
      const positions = account.data?.perpPositions || [];
      const position = positions.find((p: any) => p.position?.coin === order.coin);
      const currentLeverage = position?.leverage?.value || 1;
      
      const marginForOrder = notionalValue / currentLeverage;
      return sum + marginForOrder;
    }, 0);
    
    console.log('[OrderTicket] Fallback Tradeable Balance Calculation:');
    console.log('  Account Value:', total);
    console.log('  Margin Used:', used);
    console.log('  Margin in Open Orders:', openOrdersMargin);
    console.log('  Tradeable Balance:', total - used - openOrdersMargin);
    
    return total - used - openOrdersMargin;
  }, [account.data]);
  
  // Load per-ticker leverage (default to 1)
  const loadLeverageForCoin = (coin: string) => {
    return 1; // Default, will be loaded from AsyncStorage
  };
  
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType | null>(null); // null until loaded from storage
  const [price, setPrice] = useState('');
  const [marginRequired, setMarginRequired] = useState(0);
  const [sizePercent, setSizePercent] = useState(0);
  const [tif, setTif] = useState<TimeInForce>('Gtc');
  const [reduceOnly, setReduceOnly] = useState(false);
  
  // TP/SL state
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [tpslExpanded, setTpslExpanded] = useState(false);
  
  const [leverage, setLeverage] = useState(1);
  
  const [marginType, setMarginType] = useState<'cross' | 'isolated'>('cross');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get asset info for the coin
  const assetInfo = useMemo(() => {
    const market = perpMarkets.find(m => m.name === coin);
    
    console.log('[OrderTicket] ========== ASSET INFO ==========');
    console.log('[OrderTicket] Coin:', coin);
    console.log('[OrderTicket] Market found:', !!market);
    if (market) {
      console.log('[OrderTicket] Market name:', market.name);
      console.log('[OrderTicket] Asset Index (from market.index):', market.index);
      console.log('[OrderTicket] Max Leverage:', market.maxLeverage);
      console.log('[OrderTicket] Size Decimals:', market.szDecimals);
    }
    console.log('[OrderTicket] ======================================');
    
    return {
      index: market?.index ?? 0,
      maxLeverage: market?.maxLeverage ?? 5,
      szDecimals: market?.szDecimals ?? 4, // CRITICAL: Use ?? not || to handle szDecimals: 0
    };
  }, [coin, perpMarkets]);

  // Set default side when modal opens
  useEffect(() => {
    if (visible && defaultSide) {
      setSide(defaultSide);
    }
  }, [visible, defaultSide]);

  // Load order type preference IMMEDIATELY when modal becomes visible
  useEffect(() => {
    const loadOrderTypePreference = async () => {
      try {
        const savedOrderType = await AsyncStorage.getItem('hl_order_type');
        console.log('[OrderTicket] Loading saved order type from storage:', savedOrderType);
        
        if (savedOrderType) {
          const type = savedOrderType as OrderType;
          console.log('[OrderTicket] Setting order type to:', type);
          setOrderType(type);
          setTif(type === 'market' ? 'Ioc' : 'Gtc');
        } else {
          console.log('[OrderTicket] No saved order type, defaulting to market');
          setOrderType('market');
          setTif('Gtc');
        }
      } catch (err) {
        console.error('[OrderTicket] Failed to load order type:', err);
        setOrderType('market');
        setTif('Gtc');
      }
    };
    
    if (visible) {
      loadOrderTypePreference();
    }
  }, [visible]);

  // Load other preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedSide = await AsyncStorage.getItem('hl_order_side');
        const savedMarginType = await AsyncStorage.getItem('hl_order_margin_type');
        const savedLeverage = await AsyncStorage.getItem(`hl_order_leverage_${coin}`);
        
        // Only apply saved side if no defaultSide is provided
        if (savedSide && !defaultSide) setSide(savedSide as OrderSide);
        
        if (savedMarginType) setMarginType(savedMarginType as 'cross' | 'isolated');
        if (savedLeverage) {
          const lev = parseInt(savedLeverage, 10);
          setLeverage(Math.min(lev, assetInfo.maxLeverage));
        }
      } catch (err) {
        console.error('[OrderTicket] Failed to load preferences:', err);
      }
    };
    
    if (visible && coin) {
      loadPreferences();
    }
  }, [visible, coin, assetInfo.maxLeverage, defaultSide]);

  // Save preferences immediately when they change
  useEffect(() => {
    if (visible && side) {
      AsyncStorage.setItem('hl_order_side', side);
    }
  }, [side, visible]);
  
  useEffect(() => {
    if (orderType && orderType !== null) {
      console.log('[OrderTicket] Saving order type to storage:', orderType);
      AsyncStorage.setItem('hl_order_type', orderType);
    }
  }, [orderType]);
  
  useEffect(() => {
    if (visible && marginType) {
      AsyncStorage.setItem('hl_order_margin_type', marginType);
    }
  }, [marginType, visible]);

  // Save per-ticker leverage
  const isRestoringRef = useRef(false);
  const prevCoinRef = useRef(coin);
  
  useEffect(() => {
    if (prevCoinRef.current !== coin) {
      isRestoringRef.current = true;
      prevCoinRef.current = coin;
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, [coin]);
  
  useEffect(() => {
    if (visible && !isRestoringRef.current) {
      AsyncStorage.setItem(`hl_order_leverage_${coin}`, leverage.toString());
    }
  }, [leverage, coin, visible]);

  // Reset when coin changes
  useEffect(() => {
    if (coin) {
      // Cap leverage at max allowed
      setLeverage(prev => Math.min(prev, assetInfo.maxLeverage));
      
      // Reset price based on order type
      if (orderType === 'limit') {
        setPrice(currentPrice || '');
      }
    }
  }, [coin, assetInfo.maxLeverage]);

  // Auto-fill price for market orders
  const getMarketPrice = () => {
    if (!currentPrice) {
      return '';
    }

    const midPrice = parseFloat(currentPrice);
    
    // For market orders (IOC), use 0.1% slippage to guarantee fill
    if (side === 'buy') {
      // Buy market: pay 0.1% above mid to hit asks
      const marketPrice = (midPrice * 1.001).toString();
      console.log('[OrderTicket] Buy market price:', marketPrice, '(mid:', midPrice, '+ 0.1%)');
      return marketPrice;
    } else {
      // Sell market: accept 0.1% below mid to hit bids
      const marketPrice = (midPrice * 0.999).toString();
      console.log('[OrderTicket] Sell market price:', marketPrice, '(mid:', midPrice, '- 0.1%)');
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

  const handleSubmit = () => {
    if (!exchangeClient) {
      setError('Wallet not connected');
      return;
    }

    if (!price || !marginRequired) {
      setError('Please enter price and margin amount');
      return;
    }
    
    const sizeValue = orderStats.size;
    if (isNaN(sizeValue) || sizeValue <= 0) {
      setError('Invalid size (check price and margin)');
      return;
    }

    // Validate TP/SL prices
    const entryPrice = parseFloat(price);
    const tpPrice = takeProfitPrice ? parseFloat(takeProfitPrice) : null;
    const slPrice = stopLossPrice ? parseFloat(stopLossPrice) : null;

    if (tpPrice) {
      if (side === 'buy' && tpPrice <= entryPrice) {
        setError('Take Profit price must be higher than entry price for long positions');
        return;
      }
      if (side === 'sell' && tpPrice >= entryPrice) {
        setError('Take Profit price must be lower than entry price for short positions');
        return;
      }
    }

    if (slPrice) {
      if (side === 'buy' && slPrice >= entryPrice) {
        setError('Stop Loss price must be lower than entry price for long positions');
        return;
      }
      if (side === 'sell' && slPrice <= entryPrice) {
        setError('Stop Loss price must be higher than entry price for short positions');
        return;
      }
    }

    setError(null);
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    if (!exchangeClient) return;

    setIsSubmitting(true);
    setError(null);
    setShowConfirmation(false);

    try {
      // Step 1: Update leverage
      console.log('[OrderTicket] ========== UPDATING LEVERAGE ==========');
      console.log('[OrderTicket] Coin:', coin);
      console.log('[OrderTicket] Asset Index:', assetInfo.index);
      console.log('[OrderTicket] Current Leverage:', leverage);
      console.log('[OrderTicket] Max Leverage:', assetInfo.maxLeverage);
      console.log('[OrderTicket] Margin Type:', marginType);
      console.log('[OrderTicket] Is Cross:', marginType === 'cross');
      console.log('[OrderTicket] =======================================');
      
      await exchangeClient.updateLeverage({
        asset: assetInfo.index,
        isCross: marginType === 'cross',
        leverage,
      });
      
      console.log('[OrderTicket] ✓ Leverage updated');

      // Step 2: Format size and price
      const sizeValue = orderStats.size;
      const priceValue = parseFloat(price);
      
      console.log('[OrderTicket] ========== FORMATTING FOR API ==========');
      console.log('[OrderTicket] Raw Size (number):', sizeValue);
      console.log('[OrderTicket] Raw Price:', priceValue);
      console.log('[OrderTicket] szDecimals:', assetInfo.szDecimals);
      
      const formattedSize = formatSize(sizeValue, assetInfo.szDecimals, priceValue);
      const formattedPrice = formatPrice(priceValue, assetInfo.szDecimals);
      
      console.log('[OrderTicket] Formatted Size:', formattedSize);
      console.log('[OrderTicket] Formatted Price:', formattedPrice);
      console.log('[OrderTicket] =======================================');

      const finalTif = orderType === 'market' ? 'Ioc' : tif;

      const orderPayload = {
        orders: [{
          a: assetInfo.index,
          b: side === 'buy',
          p: formattedPrice,
          s: formattedSize,
          r: reduceOnly,
          t: {
            limit: { tif: finalTif },
          },
        }],
        grouping: 'na' as const,
      };

      console.log('[OrderTicket] ========== PLACING ORDER ==========');
      console.log('[OrderTicket] Full Payload:', JSON.stringify(orderPayload, null, 2));
      console.log('[OrderTicket] ==========================================');

      const result = await exchangeClient.order(orderPayload);

      console.log('[OrderTicket] ✓ Order placed:', result);
      
      // Step 3: Place TP/SL orders if specified
      if (takeProfitPrice || stopLossPrice) {
        console.log('[OrderTicket] ========== PLACING TP/SL ORDERS ==========');
        
        if (takeProfitPrice) {
          const tpPriceValue = parseFloat(takeProfitPrice);
          const formattedTPPrice = formatPrice(tpPriceValue, assetInfo.szDecimals);
          
          const tpOrderPayload = {
            orders: [{
              a: assetInfo.index,
              b: side !== 'buy',
              p: formattedTPPrice,
              s: formattedSize,
              r: true,
              t: {
                trigger: {
                  triggerPx: formattedTPPrice,
                  isMarket: true,
                  tpsl: 'tp' as const,
                },
              },
            }],
            grouping: 'positionTpsl' as const,
          };
          
          console.log('[OrderTicket] TP Order:', JSON.stringify(tpOrderPayload, null, 2));
          await exchangeClient.order(tpOrderPayload);
          console.log('[OrderTicket] ✓ TP order placed');
        }
        
        if (stopLossPrice) {
          const slPriceValue = parseFloat(stopLossPrice);
          const formattedSLPrice = formatPrice(slPriceValue, assetInfo.szDecimals);
          
          const slOrderPayload = {
            orders: [{
              a: assetInfo.index,
              b: side !== 'buy',
              p: formattedSLPrice,
              s: formattedSize,
              r: true,
              t: {
                trigger: {
                  triggerPx: formattedSLPrice,
                  isMarket: true,
                  tpsl: 'sl' as const,
                },
              },
            }],
            grouping: 'positionTpsl' as const,
          };
          
          console.log('[OrderTicket] SL Order:', JSON.stringify(slOrderPayload, null, 2));
          await exchangeClient.order(slOrderPayload);
          console.log('[OrderTicket] ✓ SL order placed');
        }
        
        console.log('[OrderTicket] ==========================================');
      }
      
      // Clear form
      setPrice(orderType === 'market' ? getMarketPrice() : currentPrice || '');
      setMarginRequired(0);
      setSizePercent(0);
      setTakeProfitPrice('');
      setStopLossPrice('');
      setError(null);
      
      const successMsg = takeProfitPrice || stopLossPrice ? 
        'Order placed with TP/SL successfully!' : 
        'Order placed successfully!';
      Alert.alert('Success', successMsg);
      
      // Trigger account refetch
      setTimeout(() => refetchAccount(), 1000);
      
      // Close modal
      onClose();
    } catch (err: any) {
      console.error('[OrderTicket] Failed to place order:', err);
      setError(err.message || 'Failed to place order');
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate size from margin required and leverage
  // CRITICAL: Use FORMATTED price for size calculation to match what's sent to API
  const orderStats = useMemo(() => {
    const p = parseFloat(price) || 0;
    
    if (!p || !marginRequired) {
      return {
        size: 0,
        sizeFormatted: '0',
        orderSize: '0.00',
        marginRequiredDisplay: '0.00',
      };
    }
    
    // Format the price first (same formatting that will be used in the API call)
    const formattedPrice = formatPrice(p, assetInfo.szDecimals);
    const formattedPriceNum = parseFloat(formattedPrice);
    
    // Calculate size using the FORMATTED price to ensure consistency
    const orderSizeUSD = marginRequired * leverage;
    const tokenSize = orderSizeUSD / formattedPriceNum;
    
    return {
      size: tokenSize,
      sizeFormatted: tokenSize.toFixed(assetInfo.szDecimals),
      orderSize: orderSizeUSD.toFixed(2),
      marginRequiredDisplay: marginRequired.toFixed(2),
    };
  }, [marginRequired, price, leverage, assetInfo.szDecimals]);
  
  // Calculate TP/SL percentages
  const tpslPercentages = useMemo(() => {
    const entryPrice = parseFloat(price) || 0;
    const tpPrice = parseFloat(takeProfitPrice) || 0;
    const slPrice = parseFloat(stopLossPrice) || 0;
    
    if (!entryPrice) {
      return { tpPercent: 0, slPercent: 0, tpValid: true, slValid: true };
    }
    
    let tpValid = true;
    if (tpPrice) {
      if (side === 'buy' && tpPrice <= entryPrice) tpValid = false;
      if (side === 'sell' && tpPrice >= entryPrice) tpValid = false;
    }
    
    let slValid = true;
    if (slPrice) {
      if (side === 'buy' && slPrice >= entryPrice) slValid = false;
      if (side === 'sell' && slPrice <= entryPrice) slValid = false;
    }
    
    const tpPercent = tpPrice ? 
      (side === 'buy' ? 
        ((tpPrice - entryPrice) / entryPrice) * 100 : 
        ((entryPrice - tpPrice) / entryPrice) * 100
      ) : 0;
    
    const slPercent = slPrice ? 
      (side === 'buy' ? 
        ((slPrice - entryPrice) / entryPrice) * 100 : 
        ((entryPrice - slPrice) / entryPrice) * 100
      ) : 0;
    
    return { tpPercent, slPercent, tpValid, slValid };
  }, [price, takeProfitPrice, stopLossPrice, side]);
  
  // Handle margin slider change
  const handleSizePercentChange = (percent: number) => {
    setSizePercent(percent);
    
    if (!tradeableBalance) {
      setMarginRequired(0);
      return;
    }
    
    const margin = tradeableBalance * (percent / 100);
    setMarginRequired(margin);
  };
  
  // Handle manual margin change
  const handleMarginChange = (value: string) => {
    const margin = parseFloat(value) || 0;
    setMarginRequired(margin);
    setSizePercent(0);
  };
  
  // Update market order price when side or currentPrice changes
  useEffect(() => {
    if (orderType === 'market') {
      const marketPrice = getMarketPrice();
      if (marketPrice) {
        setPrice(marketPrice);
      }
    }
  }, [orderType, side, currentPrice]);

  if (!coin || orderType === null) {
    // Wait for order type to load from storage
    return <View />;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
                style={[
                  styles.sideButton,
                  side === 'buy' && styles.sideButtonBuyActive,
                ]}
                onPress={() => setSide('buy')}
              >
                <Text style={[styles.sideButtonText, side === 'buy' && styles.sideButtonTextBuy]}>
                  Buy / Long
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  side === 'sell' && styles.sideButtonSellActive,
                ]}
                onPress={() => setSide('sell')}
              >
                <Text style={[styles.sideButtonText, side === 'sell' && styles.sideButtonTextSell]}>
                  Sell / Short
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
                <Text style={styles.inputLabelText}>{coin} Price (USD)</Text>
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
                <TouchableOpacity
                  style={styles.useMarketButton}
                  onPress={() => setPrice(currentPrice)}
                >
                  <Text style={styles.useMarketButtonText}>
                    Use Market: ${formatWithCommas(parseFloat(currentPrice), 2)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Margin Required Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Text style={styles.inputLabelText}>Margin Required (USD)</Text>
                <Text style={styles.inputLabelBadge}>Tradeable: ${formatWithCommas(tradeableBalance, 2)}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={marginRequired ? marginRequired.toString() : ''}
                onChangeText={handleMarginChange}
                placeholder="0.00"
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

            {/* Leverage Slider */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Text style={styles.inputLabelText}>Leverage: {leverage}x</Text>
                <Text style={styles.inputLabelBadge}>Max: {assetInfo.maxLeverage}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={assetInfo.maxLeverage}
                step={1}
                value={Math.min(leverage, assetInfo.maxLeverage)}
                onValueChange={setLeverage}
                minimumTrackTintColor={Color.BRIGHT_ACCENT}
                maximumTrackTintColor={Color.BG_3}
                thumbTintColor={Color.BRIGHT_ACCENT}
              />
            </View>

            {/* Margin Type */}
            <View style={styles.marginTypeSelector}>
              <TouchableOpacity
                style={[styles.marginButton, marginType === 'cross' && styles.marginButtonActive]}
                onPress={() => setMarginType('cross')}
              >
                <Text style={[styles.marginButtonText, marginType === 'cross' && styles.marginButtonTextActive]}>
                  Cross
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.marginButton, marginType === 'isolated' && styles.marginButtonActive]}
                onPress={() => setMarginType('isolated')}
              >
                <Text style={[styles.marginButtonText, marginType === 'isolated' && styles.marginButtonTextActive]}>
                  Isolated
                </Text>
              </TouchableOpacity>
            </View>

            {/* TP/SL Section */}
            <View style={styles.tpslSection}>
              <TouchableOpacity 
                style={styles.tpslHeader}
                onPress={() => setTpslExpanded(!tpslExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.tpslTitle}>Take Profit / Stop Loss</Text>
                <Text style={[styles.tpslChevron, tpslExpanded && styles.tpslChevronExpanded]}>
                  ›
                </Text>
              </TouchableOpacity>
              
              {tpslExpanded && (
                <>
                  <View style={[styles.tpslInputGroup, { marginTop: 15 }]}>
                    <View style={styles.inputLabel}>
                      <Text style={styles.inputLabelText}>Take Profit Price</Text>
                      {tpslPercentages.tpPercent !== 0 && (
                        <Text style={[
                          styles.tpslPercent,
                          tpslPercentages.tpPercent > 0 ? styles.tpslPercentGain : styles.tpslPercentLoss
                        ]}>
                          {tpslPercentages.tpPercent > 0 ? '+' : ''}{tpslPercentages.tpPercent.toFixed(2)}%
                        </Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.tpslTextInput,
                        takeProfitPrice && !tpslPercentages.tpValid && styles.tpslTextInputInvalid
                      ]}
                      value={takeProfitPrice}
                      onChangeText={setTakeProfitPrice}
                      placeholder="Optional"
                      placeholderTextColor={Color.FG_3}
                      keyboardType="decimal-pad"
                    />
                    {takeProfitPrice && !tpslPercentages.tpValid && (
                      <Text style={styles.validationError}>
                        {side === 'buy' ? 'Must be > entry price' : 'Must be < entry price'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.tpslInputGroup}>
                    <View style={styles.inputLabel}>
                      <Text style={styles.inputLabelText}>Stop Loss Price</Text>
                      {tpslPercentages.slPercent !== 0 && (
                        <Text style={[
                          styles.tpslPercent,
                          tpslPercentages.slPercent > 0 ? styles.tpslPercentGain : styles.tpslPercentLoss
                        ]}>
                          {tpslPercentages.slPercent > 0 ? '+' : ''}{tpslPercentages.slPercent.toFixed(2)}%
                        </Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.tpslTextInput,
                        stopLossPrice && !tpslPercentages.slValid && styles.tpslTextInputInvalid
                      ]}
                      value={stopLossPrice}
                      onChangeText={setStopLossPrice}
                      placeholder="Optional"
                      placeholderTextColor={Color.FG_3}
                      keyboardType="decimal-pad"
                    />
                    {stopLossPrice && !tpslPercentages.slValid && (
                      <Text style={styles.validationError}>
                        {side === 'buy' ? 'Must be < entry price' : 'Must be > entry price'}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* Advanced Options */}
            <View style={styles.advancedOptions}>
              {orderType === 'limit' && (
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
              )}

              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setReduceOnly(!reduceOnly)}
              >
                <View style={[styles.checkbox, reduceOnly && styles.checkboxChecked]}>
                  {reduceOnly && <Text style={{ color: Color.FG_1, fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>Reduce Only</Text>
              </TouchableOpacity>
            </View>

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tradeable Balance:</Text>
                <Text style={styles.summaryValue}>${formatWithCommas(tradeableBalance, 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Margin Required:</Text>
                <Text style={styles.summaryValue}>${formatWithCommas(parseFloat(orderStats.marginRequiredDisplay), 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Token Size:</Text>
                <Text style={styles.summaryValue}>{orderStats.sizeFormatted} {coin}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Text style={styles.summaryLabel}>Position Size:</Text>
                <Text style={styles.summaryValue}>${formatWithCommas(parseFloat(orderStats.orderSize), 2)}</Text>
              </View>
            </View>

            {/* Error Message
            {error && (
              <View style={styles.errorMessage}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )} 
             this should instead be an alert banner using react-native-notifier
             */}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                side === 'buy' ? styles.submitButtonBuy : styles.submitButtonSell,
                (isSubmitting || !price || !marginRequired || !exchangeClient ||
                  parseFloat(orderStats.marginRequiredDisplay) > tradeableBalance) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={
                isSubmitting || 
                !price || 
                !marginRequired || 
                !exchangeClient ||
                parseFloat(orderStats.marginRequiredDisplay) > tradeableBalance
              }
            >
              {isSubmitting ? (
                <ActivityIndicator color={Color.FG_1} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {parseFloat(orderStats.marginRequiredDisplay) > tradeableBalance
                    ? 'Insufficient Balance'
                    : `${side === 'buy' ? 'Buy' : 'Sell'} ${coin}`
                  }
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <Modal
            visible={showConfirmation}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowConfirmation(false)}
          >
            <TouchableOpacity 
              style={styles.confirmationOverlay}
              activeOpacity={1}
              onPress={() => setShowConfirmation(false)}
            >
              <TouchableOpacity 
                style={styles.confirmationModal}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.confirmationTitle}>Confirm Order</Text>
                <View style={styles.confirmDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Market:</Text>
                    <Text style={styles.detailValue}>{coin}-PERP</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Side:</Text>
                    <Text style={[
                      styles.detailValue,
                      side === 'buy' ? styles.detailValueBuy : styles.detailValueSell
                    ]}>
                      {side === 'buy' ? 'BUY / LONG' : 'SELL / SHORT'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{orderType.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>${formatWithCommas(parseFloat(price), 2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Token Size:</Text>
                    <Text style={styles.detailValue}>{orderStats.sizeFormatted} {coin}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Margin Required:</Text>
                    <Text style={styles.detailValue}>${formatWithCommas(parseFloat(orderStats.marginRequiredDisplay), 2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Position Size:</Text>
                    <Text style={styles.detailValue}>${formatWithCommas(parseFloat(orderStats.orderSize), 2)}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>Leverage:</Text>
                    <Text style={styles.detailValue}>{leverage}x {marginType}</Text>
                  </View>
                </View>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowConfirmation(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      side === 'buy' ? styles.confirmButtonBuy : styles.confirmButtonSell,
                      isSubmitting && styles.confirmButtonDisabled
                    ]}
                    onPress={confirmOrder}
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


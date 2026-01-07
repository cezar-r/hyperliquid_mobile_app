/**
 * Spot Order Ticket Modal
 * Interface for placing spot limit and market orders
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Modal, ScrollView, Alert, unstable_batchedUpdates } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { formatPrice, formatSize, formatWithCommas } from '../../../lib/formatting';
import { getSkipOpenOrderConfirmations } from '../../../lib/confirmations';
import { playOrderTicketSelectionChangeHaptic, playSliderChangeHaptic, playOrderSubmitHaptic } from '../../../lib/haptics';
import { logModalOpen, logModalClose, logUserAction, logApiCall } from '../../../lib/logger';
import { styles } from './styles/SpotOrderTicket.styles';
import { InfoContainer, InfoRow } from '../shared/components/info_container/InfoContainer';
import {
  CloseButton,
  ToggleContainer,
  ToggleButton,
  PriceContainer,
  SizeContainer,
  TifSelector,
  SubmitButton,
  ConfirmationModal,
} from './components';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface SpotOrderTicketProps {
  visible: boolean;
  onClose: () => void;
  defaultSide?: OrderSide;
}

export const SpotOrderTicket: React.FC<SpotOrderTicketProps> = ({ visible, onClose, defaultSide }) => {
  const { exchangeClient, account, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { selectedCoin, prices, spotMarkets, orderbook } = wsState;

  const coin = selectedCoin || '';
  const currentPrice = prices[coin];

  // Log modal open/close
  useEffect(() => {
    if (visible) {
      logModalOpen('SpotOrderTicket');
    }
  }, [visible]);

  const handleClose = () => {
    logModalClose('SpotOrderTicket');
    onClose();
  };
  
  // Get spot asset info
  const assetInfo = useMemo(() => {
    console.log('[SpotOrderTicket] Looking for coin:', coin);
    
    const market = spotMarkets.find(m => m.name === coin);
    
    console.log('[SpotOrderTicket] Market found:', !!market);
    if (market) {
      console.log('[SpotOrderTicket] Universe Index:', market.index, 'Size Decimals:', market.szDecimals);
    }
    
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
  
  // Get token balance (available = total - hold)
  const tokenBalance = useMemo(() => {
    const spotBalances = account.data?.spotBalances || [];
    const baseToken = coin.split('/')[0];
    const token = spotBalances.find((b: any) => b.coin === baseToken);
    const total = parseFloat(token?.total || '0');
    const hold = parseFloat(token?.hold || '0');
    const available = total - hold;
    console.log('[SpotOrderTicket] Token balance - Total:', total, 'Hold:', hold, 'Available:', available);
    console.log('[SpotOrderTicket] Raw token data:', JSON.stringify(token, null, 2));
    return available;
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

  // Track slider activity to gate orderbook price updates during drag
  const isSliderActiveRef = useRef(false);

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
        console.log('[SpotOrderTicket] Loading saved order type:', savedOrderType);
        
        if (savedOrderType) {
          const type = savedOrderType as OrderType;
          setOrderType(type);
          setTif(type === 'market' ? 'Ioc' : 'Gtc');
        } else {
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

  // Load side preference and reset sliders
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedSide = await AsyncStorage.getItem('hl_order_side');
        if (savedSide && !defaultSide) setSide(savedSide as OrderSide);

        // Always reset sliders to 0 when opening
        setSizePercent(0);
        setSize('');
      } catch (err) {
        console.error('[SpotOrderTicket] Failed to load preferences:', err);
      }
    };

    if (visible && coin) {
      loadPreferences();
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
      AsyncStorage.setItem('hl_order_type', orderType);
    }
  }, [orderType]);

  // Get display price for market orders (no slippage - shows actual market price)
  const getDisplayPrice = () => {
    if (orderbook && orderbook.levels) {
      const asks = orderbook.levels[1];
      const bids = orderbook.levels[0];

      if (side === 'buy' && asks.length > 0) {
        const lowestAsk = parseFloat(asks[0].px);
        return formatPrice(lowestAsk, assetInfo.szDecimals, false);
      } else if (side === 'sell' && bids.length > 0) {
        const highestBid = parseFloat(bids[0].px);
        return formatPrice(highestBid, assetInfo.szDecimals, false);
      }
    }
    // Fallback to mid price
    return currentPrice ? formatPrice(parseFloat(currentPrice), assetInfo.szDecimals, false) : '';
  };

  // Get execution price for market orders with 2% slippage
  const getMarketPriceWithSlippage = () => {
    if (orderbook && orderbook.levels) {
      const asks = orderbook.levels[1];
      const bids = orderbook.levels[0];

      if (side === 'buy' && asks.length > 0) {
        const lowestAsk = parseFloat(asks[0].px);
        const priceWithSlippage = lowestAsk * 1.02; // 2% slippage for IOC
        const marketPrice = formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
        console.log('[SpotOrderTicket] Buy execution price:', marketPrice, '(lowest ask:', lowestAsk, ')');
        return marketPrice;
      } else if (side === 'sell' && bids.length > 0) {
        const highestBid = parseFloat(bids[0].px);
        const priceWithSlippage = highestBid * 0.98; // 2% slippage for IOC
        const marketPrice = formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
        console.log('[SpotOrderTicket] Sell execution price:', marketPrice, '(highest bid:', highestBid, ')');
        return marketPrice;
      }
    }

    if (!currentPrice) {
      return '';
    }

    const midPrice = parseFloat(currentPrice);

    if (side === 'buy') {
      const priceWithSlippage = midPrice * 1.01;
      return formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
    } else {
      const priceWithSlippage = midPrice * 0.99;
      return formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
    }
  };

  const handleOrderTypeChange = (type: OrderType) => {
    playOrderTicketSelectionChangeHaptic();
    setOrderType(type);
    if (type === 'market') {
      setTif('Ioc');
      setPrice(getDisplayPrice());
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

  // Handle slider change - batched to reduce re-renders
  const handleSizePercentChange = useCallback((percent: number) => {
    unstable_batchedUpdates(() => {
      setSizePercent(percent);
      if (side === 'buy') {
        const p = parseFloat(price || currentPrice || '0');
        if (p > 0) {
          const usdToSpend = usdcBalance * (percent / 100);
          const tokenAmount = usdToSpend / p;
          setSize(tokenAmount.toFixed(assetInfo.szDecimals));
        }
      } else {
        const tokenAmount = tokenBalance * (percent / 100);
        setSize(tokenAmount.toFixed(assetInfo.szDecimals));
      }
    });
  }, [side, price, currentPrice, usdcBalance, tokenBalance, assetInfo.szDecimals]);

  const handleSizeChange = useCallback((value: string) => {
    unstable_batchedUpdates(() => {
      setSize(value);
      setSizePercent(0);
    });
  }, []);

  // Slider activity handlers to gate orderbook updates during drag
  const handleSliderStart = useCallback(() => {
    isSliderActiveRef.current = true;
  }, []);

  const handleSliderComplete = useCallback(() => {
    isSliderActiveRef.current = false;
  }, []);

  const handleSubmit = async () => {
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
    
    const skipConfirmations = await getSkipOpenOrderConfirmations();
    if (skipConfirmations) {
      handleConfirmOrder();
    } else {
      setShowConfirmation(true);
    }
  };

  const handleConfirmOrder = async () => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const sizeValue = parseFloat(size);
    // For market orders, use price with slippage for execution
    const executionPrice = orderType === 'market' ? getMarketPriceWithSlippage() : price;
    const priceValue = parseFloat(executionPrice);

    if (!priceValue || !sizeValue) {
      setError('Price and size required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowConfirmation(false);

    try {
      console.log('[SpotOrderTicket] Placing order - Coin:', coin, 'Universe Index:', assetInfo.index);
      console.log('[SpotOrderTicket] Current balances - Token:', tokenBalance, 'USDC:', usdcBalance);

      const formattedPrice = formatPrice(priceValue, assetInfo.szDecimals, false);
      const formattedSize = formatSize(sizeValue, assetInfo.szDecimals, priceValue);

      console.log('[SpotOrderTicket] Formatted Price:', formattedPrice, 'Formatted Size:', formattedSize);

      const finalTif = orderType === 'market' ? 'Ioc' : tif;

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

      console.log('[SpotOrderTicket] Order payload:', JSON.stringify(orderPayload, null, 2));

      logApiCall('order (spot)', `${side} ${orderType} - ${coin}`);
      logUserAction('SpotOrderTicket', 'Submit order', `${side} ${orderType} ${coin}`);

      const result = await exchangeClient.order(orderPayload);

      console.log('[SpotOrderTicket] ✓ Spot order placed successfully:', result);
      
      setTimeout(() => refetchAccount(), 2000);

      setSize('');
      setSizePercent(0);
      if (orderType === 'limit') {
        setPrice('');
      }

      Alert.alert('Success', `${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      handleClose();
    } catch (err: any) {
      console.error('[SpotOrderTicket] Order error:', err);
      
      setError(err.message || 'Failed to place order');
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update market order price when side, currentPrice, or orderbook changes
  // Gate updates during slider interaction to prevent jank
  useEffect(() => {
    if (orderType === 'market' && !isSliderActiveRef.current) {
      const displayPrice = getDisplayPrice();
      if (displayPrice) {
        setPrice(displayPrice);
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
              <CloseButton onPress={handleClose} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  const tradeableLabel = side === 'buy' 
    ? `$${formatWithCommas(usdcBalance, 2)}` 
    : `${formatWithCommas(tokenBalance, 4)} ${coin.split('/')[0]}`;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <CloseButton onPress={onClose} />
            
            {/* Side Selector */}
            <ToggleContainer>
              <ToggleButton
                label="Buy"
                isActive={side === 'buy'}
                onPress={() => {
                  playOrderTicketSelectionChangeHaptic();
                  setSide('buy');
                }}
                variant="buy"
              />
              <ToggleButton
                label="Sell"
                isActive={side === 'sell'}
                onPress={() => {
                  playOrderTicketSelectionChangeHaptic();
                  setSide('sell');
                }}
                variant="sell"
              />
            </ToggleContainer>

            {/* Order Type */}
            <ToggleContainer>
              <ToggleButton
                label="Limit"
                isActive={orderType === 'limit'}
                onPress={() => handleOrderTypeChange('limit')}
                variant="default"
              />
              <ToggleButton
                label="Market"
                isActive={orderType === 'market'}
                onPress={() => handleOrderTypeChange('market')}
                variant="default"
              />
            </ToggleContainer>

            {/* Price Input */}
            <PriceContainer
              coin={coin}
              price={price}
              onPriceChange={setPrice}
              currentPrice={currentPrice}
              orderType={orderType}
              onUseMarket={() => setPrice(currentPrice || '')}
            />

            {/* Size Input */}
            <SizeContainer
              coin={coin}
              size={size}
              onSizeChange={handleSizeChange}
              sizePercent={sizePercent}
              onSizePercentChange={handleSizePercentChange}
              tradeableBalance={side === 'buy' ? usdcBalance : tokenBalance}
              tradeableLabel={tradeableLabel}
              side={side}
              onSliderChange={playSliderChangeHaptic}
              onSliderStart={handleSliderStart}
              onSliderComplete={handleSliderComplete}
            />

            {/* Advanced Options */}
            {orderType === 'limit' && (
              <View style={styles.advancedOptions}>
                <TifSelector
                  value={tif}
                  onValueChange={setTif}
                />
              </View>
            )}

            {/* Order Summary */}
            <InfoContainer>
              <InfoRow 
                label={side === 'buy' ? 'USDC Balance:' : `${coin.split('/')[0]} Balance:`}
                value={side === 'buy' ? `$${formatWithCommas(usdcBalance, 2)}` : `${formatWithCommas(tokenBalance, 4)}`}
              />
              <InfoRow 
                label={side === 'buy' ? 'Cost:' : 'Proceeds:'}
                value={`$${formatWithCommas(parseFloat(orderStats.costDisplay), 2)}`}
                isLast
              />
            </InfoContainer>

            {/* Submit Button */}
            <SubmitButton
              label={
                side === 'buy' && orderStats.cost > usdcBalance
                  ? 'Insufficient USDC'
                  : side === 'sell' && parseFloat(size) > tokenBalance
                  ? `Insufficient ${coin.split('/')[0]}`
                  : `${side === 'buy' ? 'Buy' : 'Sell'} ${coin.split('/')[0]}`
              }
              onPress={() => {
                playOrderSubmitHaptic();
                handleSubmit();
              }}
              disabled={
                isSubmitting ||
                !price ||
                !size ||
                !exchangeClient ||
                (side === 'buy' && orderStats.cost > usdcBalance) ||
                (side === 'sell' && parseFloat(size) > tokenBalance)
              }
              isSubmitting={isSubmitting}
              side={side}
            />
          </ScrollView>
        </View>

        {/* Confirmation Modal */}
        <ConfirmationModal
          visible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmOrder}
          isSubmitting={isSubmitting}
          orderDetails={{
            coin,
            side,
            orderType,
            price,
            tokenSize: '',
            size,
            cost: orderStats.costDisplay,
          }}
          isSpot={true}
        />
      </View>
    </Modal>
  );
};


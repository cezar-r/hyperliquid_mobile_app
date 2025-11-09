/**
 * Perp Order Ticket Modal
 * Interface for placing perp limit and market orders
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Modal, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { formatPrice, formatSize, formatWithCommas } from '../../../lib/formatting';
import { getSkipOpenOrderConfirmations } from '../../../lib/confirmations';
import { playOrderTicketSelectionChangeHaptic, playSliderChangeHaptic, playOrderSubmitHaptic } from '../../../lib/haptics';
import { styles } from './styles/PerpOrderTicket.styles';
import { InfoContainer, InfoRow } from '../shared/components/info_container/InfoContainer';
import {
  CloseButton,
  ToggleContainer,
  ToggleButton,
  PriceContainer,
  MarginContainer,
  LeverageContainer,
  TpSlContainer,
  TifSelector,
  ReduceOnlyCheckbox,
  SubmitButton,
  ConfirmationModal,
} from './components';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface PerpOrderTicketProps {
  visible: boolean;
  onClose: () => void;
  defaultSide?: OrderSide;
}

export const PerpOrderTicket: React.FC<PerpOrderTicketProps> = ({ visible, onClose, defaultSide }) => {
  const { exchangeClient, account, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const { selectedCoin, prices, perpMarkets } = wsState;

  const coin = selectedCoin || '';
  const currentPrice = prices[coin];
  
  // Get tradeable balance
  const tradeableBalance = useMemo(() => {
    const withdrawable = account.data?.perpMarginSummary?.withdrawable;
    
    if (withdrawable) {
      const amount = parseFloat(withdrawable);
      console.log('[PerpOrderTicket] Using withdrawable from API:', amount);
      return amount;
    }
    
    const accountValue = account.data?.perpMarginSummary?.accountValue;
    const marginUsed = account.data?.perpMarginSummary?.totalMarginUsed;
    const openOrders = account.data?.openOrders || [];
    
    if (!accountValue) return 0;
    
    const total = parseFloat(accountValue);
    const used = parseFloat(marginUsed || '0');
    
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
    
    console.log('[PerpOrderTicket] Fallback Tradeable Balance Calculation:', total - used - openOrdersMargin);
    
    return total - used - openOrdersMargin;
  }, [account.data]);
  
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
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
    
    console.log('[PerpOrderTicket] Asset Info - Coin:', coin, 'Market found:', !!market);
    if (market) {
      console.log('[PerpOrderTicket] Asset Index:', market.index, 'Max Leverage:', market.maxLeverage, 'Size Decimals:', market.szDecimals);
    }
    
    return {
      index: market?.index ?? 0,
      maxLeverage: market?.maxLeverage ?? 5,
      szDecimals: market?.szDecimals ?? 4,
    };
  }, [coin, perpMarkets]);

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
        console.log('[PerpOrderTicket] Loading saved order type:', savedOrderType);
        
        if (savedOrderType) {
          const type = savedOrderType as OrderType;
          setOrderType(type);
          setTif(type === 'market' ? 'Ioc' : 'Gtc');
        } else {
          setOrderType('market');
          setTif('Gtc');
        }
      } catch (err) {
        console.error('[PerpOrderTicket] Failed to load order type:', err);
        setOrderType('market');
        setTif('Gtc');
      }
    };
    
    if (visible) {
      loadOrderTypePreference();
    }
  }, [visible]);

  // Load other preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedSide = await AsyncStorage.getItem('hl_order_side');
        const savedMarginType = await AsyncStorage.getItem('hl_order_margin_type');
        const savedLeverage = await AsyncStorage.getItem(`hl_order_leverage_${coin}`);
        
        if (savedSide && !defaultSide) setSide(savedSide as OrderSide);
        if (savedMarginType) setMarginType(savedMarginType as 'cross' | 'isolated');
        if (savedLeverage) {
          const lev = parseInt(savedLeverage, 10);
          setLeverage(Math.min(lev, assetInfo.maxLeverage));
        }
      } catch (err) {
        console.error('[PerpOrderTicket] Failed to load preferences:', err);
      }
    };
    
    if (visible && coin) {
      loadPreferences();
    }
  }, [visible, coin, assetInfo.maxLeverage, defaultSide]);

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
      setLeverage(prev => Math.min(prev, assetInfo.maxLeverage));
      
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
    
    if (side === 'buy') {
      const marketPrice = (midPrice * 1.001).toString();
      console.log('[PerpOrderTicket] Buy market price:', marketPrice);
      return marketPrice;
    } else {
      const marketPrice = (midPrice * 0.999).toString();
      console.log('[PerpOrderTicket] Sell market price:', marketPrice);
      return marketPrice;
    }
  };

  const handleOrderTypeChange = (type: OrderType) => {
    playOrderTicketSelectionChangeHaptic();
    setOrderType(type);
    
    if (type === 'market') {
      setTif('Ioc');
      setPrice(getMarketPrice());
    } else {
      setTif('Gtc');
      setPrice(currentPrice || '');
    }
  };

  const handleSubmit = async () => {
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
    
    const skipConfirmations = await getSkipOpenOrderConfirmations();
    if (skipConfirmations) {
      confirmOrder();
    } else {
      setShowConfirmation(true);
    }
  };

  const confirmOrder = async () => {
    if (!exchangeClient) return;

    setIsSubmitting(true);
    setError(null);
    setShowConfirmation(false);

    try {
      console.log('[PerpOrderTicket] Updating leverage - Asset:', assetInfo.index, 'Leverage:', leverage, 'Is Cross:', marginType === 'cross');
      
      await exchangeClient.updateLeverage({
        asset: assetInfo.index,
        isCross: marginType === 'cross',
        leverage,
      });
      console.log('[PerpOrderTicket] ✓ Leverage updated');

      const sizeValue = orderStats.size;
      const priceValue = parseFloat(price);
      
      console.log('[PerpOrderTicket] Formatting - Raw Size:', sizeValue, 'Raw Price:', priceValue, 'szDecimals:', assetInfo.szDecimals);
      
      const formattedSize = formatSize(sizeValue, assetInfo.szDecimals, priceValue);
      const formattedPrice = formatPrice(priceValue, assetInfo.szDecimals);
      
      console.log('[PerpOrderTicket] Formatted Size:', formattedSize, 'Formatted Price:', formattedPrice);

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

      console.log('[PerpOrderTicket] Placing order:', JSON.stringify(orderPayload, null, 2));

      const result = await exchangeClient.order(orderPayload);
      console.log('[PerpOrderTicket] ✓ Order placed:', result);
      
      // Place TP/SL orders if specified
      if (takeProfitPrice || stopLossPrice) {
        console.log('[PerpOrderTicket] Placing TP/SL orders');
        
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
          
          await exchangeClient.order(tpOrderPayload);
          console.log('[PerpOrderTicket] ✓ TP order placed');
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
          
          await exchangeClient.order(slOrderPayload);
          console.log('[PerpOrderTicket] ✓ SL order placed');
        }
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
      
      setTimeout(() => refetchAccount(), 1000);
      
      onClose();
    } catch (err: any) {
      console.error('[PerpOrderTicket] Failed to place order:', err);
      setError(err.message || 'Failed to place order');
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate size from margin required and leverage
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
    
    const formattedPrice = formatPrice(p, assetInfo.szDecimals);
    const formattedPriceNum = parseFloat(formattedPrice);
    
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
            <CloseButton onPress={onClose} />
            
            {/* Side Selector */}
            <ToggleContainer>
              <ToggleButton
                label="Buy / Long"
                isActive={side === 'buy'}
                onPress={() => {
                  playOrderTicketSelectionChangeHaptic();
                  setSide('buy');
                }}
                variant="buy"
              />
              <ToggleButton
                label="Sell / Short"
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

            {/* Margin Required Input */}
            <MarginContainer
              marginRequired={marginRequired}
              onMarginChange={handleMarginChange}
              tradeableBalance={tradeableBalance}
              sizePercent={sizePercent}
              onSizePercentChange={handleSizePercentChange}
              onSliderChange={playSliderChangeHaptic}
            />

            {/* Leverage Slider */}
            <LeverageContainer
              leverage={leverage}
              onLeverageChange={setLeverage}
              maxLeverage={assetInfo.maxLeverage}
              onSliderChange={playSliderChangeHaptic}
            />

            {/* Margin Type */}
            <ToggleContainer>
              <ToggleButton
                label="Cross"
                isActive={marginType === 'cross'}
                onPress={() => {
                  playOrderTicketSelectionChangeHaptic();
                  setMarginType('cross');
                }}
                variant="default"
              />
              <ToggleButton
                label="Isolated"
                isActive={marginType === 'isolated'}
                onPress={() => {
                  playOrderTicketSelectionChangeHaptic();
                  setMarginType('isolated');
                }}
                variant="default"
              />
            </ToggleContainer>

            {/* TP/SL Section */}
            <TpSlContainer
              expanded={tpslExpanded}
              onToggleExpand={() => setTpslExpanded(!tpslExpanded)}
              takeProfitPrice={takeProfitPrice}
              onTakeProfitChange={setTakeProfitPrice}
              stopLossPrice={stopLossPrice}
              onStopLossChange={setStopLossPrice}
              tpPercent={tpslPercentages.tpPercent}
              slPercent={tpslPercentages.slPercent}
              tpValid={tpslPercentages.tpValid}
              slValid={tpslPercentages.slValid}
              side={side}
            />

            {/* Advanced Options */}
            <View style={styles.advancedOptions}>
              {orderType === 'limit' && (
                <TifSelector
                  value={tif}
                  onValueChange={setTif}
                />
              )}

              <ReduceOnlyCheckbox
                checked={reduceOnly}
                onToggle={() => setReduceOnly(!reduceOnly)}
              />
            </View>

            {/* Order Summary */}
            <InfoContainer>
              <InfoRow label="Tradeable Balance:" value={`$${formatWithCommas(tradeableBalance, 2)}`} />
              <InfoRow label="Margin Required:" value={`$${formatWithCommas(parseFloat(orderStats.marginRequiredDisplay), 2)}`} />
              <InfoRow label="Token Size:" value={`${orderStats.sizeFormatted} ${coin}`} />
              <InfoRow label="Position Size:" value={`$${formatWithCommas(parseFloat(orderStats.orderSize), 2)}`} isLast />
            </InfoContainer>

            {/* Submit Button */}
            <SubmitButton
              label={
                parseFloat(orderStats.marginRequiredDisplay) > tradeableBalance
                  ? 'Insufficient Balance'
                  : `${side === 'buy' ? 'Buy' : 'Sell'} ${coin}`
              }
              onPress={() => {
                playOrderSubmitHaptic();
                handleSubmit();
              }}
              disabled={
                isSubmitting || 
                !price || 
                !marginRequired || 
                !exchangeClient ||
                parseFloat(orderStats.marginRequiredDisplay) > tradeableBalance
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
          onConfirm={confirmOrder}
          isSubmitting={isSubmitting}
          orderDetails={{
            coin,
            side,
            orderType,
            price,
            tokenSize: orderStats.sizeFormatted,
            marginRequired: orderStats.marginRequiredDisplay,
            positionSize: orderStats.orderSize,
            leverage,
            marginType,
          }}
          isSpot={false}
        />
      </View>
    </Modal>
  );
};


/**
 * Perp Order Ticket Modal
 * Interface for placing perp limit and market orders
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Modal, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useWebSocketStore } from '../../../stores/websocketStore';
import { formatPrice, formatSize, formatWithCommas, getHip3Collateral } from '../../../lib/formatting';
import { getSkipOpenOrderConfirmations } from '../../../lib/confirmations';
import { playOrderTicketSelectionChangeHaptic, playSliderChangeHaptic, playOrderSubmitHaptic } from '../../../lib/haptics';
import { logModalOpen, logModalClose, logUserAction, logApiCall } from '../../../lib/logger';
import { getMarketContextKey, getAssetIdForMarket, parseMarketKey, findPerpMarketByKey } from '../../../lib/markets';
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
  const { exchangeClient, account, refetchAccount, getExchangeClientForDex } = useWallet();
  const { state: wsState } = useWebSocket();
  const { selectedCoin, prices, perpMarkets } = wsState;
  const orderbook = useWebSocketStore(state => state.orderbook);

  // Parse selectedCoin to handle HIP-3 dex:coin format
  const { coin: parsedCoin, dex: parsedDex } = useMemo(() => {
    return selectedCoin ? parseMarketKey(selectedCoin) : { coin: '', dex: undefined };
  }, [selectedCoin]);

  // Use parsedCoin for display, but selectedCoin (or context key) for lookups
  const coin = parsedCoin || '';

  // Get current price using correct key for HIP-3 markets
  const currentPrice = useMemo(() => {
    if (!coin) return undefined;
    const market = findPerpMarketByKey(perpMarkets, selectedCoin || '');
    if (market) {
      const priceKey = getMarketContextKey(market);
      return prices[priceKey];
    }
    return prices[coin];
  }, [coin, selectedCoin, perpMarkets, prices]);

  // Log modal open/close
  useEffect(() => {
    if (visible) {
      logModalOpen('PerpOrderTicket');
    }
  }, [visible]);

  const handleClose = () => {
    logModalClose('PerpOrderTicket');
    onClose();
  };
  
  // Get tradeable balance based on collateral type
  const tradeableBalance = useMemo(() => {
    const collateral = getHip3Collateral(parsedDex || '');

    // For non-USDC collateral (e.g., USDH), use spot balance
    if (collateral !== 'USDC') {
      const spotBalances = account.data?.spotBalances || [];
      const collateralBalance = spotBalances.find(b => b.coin === collateral);
      const balance = collateralBalance ? parseFloat(collateralBalance.total) : 0;
      console.log(`[PerpOrderTicket] Using ${collateral} spot balance:`, balance);
      return balance;
    }

    // For USDC collateral, use existing logic (perp withdrawable)
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
  }, [account.data, parsedDex]);
  
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
    // Find market using the full selectedCoin key (handles dex:coin format)
    const market = findPerpMarketByKey(perpMarkets, selectedCoin || '');

    console.log('[PerpOrderTicket] Asset Info - SelectedCoin:', selectedCoin, 'ParsedCoin:', coin, 'ParsedDex:', parsedDex, 'Market found:', !!market);
    if (market) {
      // Use getAssetIdForMarket to get the correct asset ID (handles HIP-3 formula)
      const assetId = getAssetIdForMarket(market);
      console.log('[PerpOrderTicket] Asset ID:', assetId, 'Dex:', market.dex || 'default', 'Meta Index:', market.index, 'Max Leverage:', market.maxLeverage, 'Size Decimals:', market.szDecimals);

      return {
        index: assetId, // This is now the correct asset ID for order placement
        maxLeverage: market.maxLeverage ?? 5,
        szDecimals: market.szDecimals ?? 4,
        dex: market.dex || '',
        market: market, // Keep reference to full market for later use
      };
    }

    console.warn('[PerpOrderTicket] Market not found for coin:', coin, 'selectedCoin:', selectedCoin);
    return {
      index: 0,
      maxLeverage: 5,
      szDecimals: 4,
      dex: '',
      market: null,
    };
  }, [coin, selectedCoin, parsedDex, perpMarkets]);

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

  // Load other preferences and reset sliders
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedSide = await AsyncStorage.getItem('hl_order_side');
        const savedMarginType = await AsyncStorage.getItem('hl_order_margin_type');

        if (savedSide && !defaultSide) setSide(savedSide as OrderSide);
        if (savedMarginType) setMarginType(savedMarginType as 'cross' | 'isolated');

        // Always reset sliders to 0 when opening
        setSizePercent(0);
        setMarginRequired(0);
        setLeverage(1);
      } catch (err) {
        console.error('[PerpOrderTicket] Failed to load preferences:', err);
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
  
  useEffect(() => {
    if (visible && marginType) {
      AsyncStorage.setItem('hl_order_margin_type', marginType);
    }
  }, [marginType, visible]);

  // Reset when coin changes
  useEffect(() => {
    if (coin) {
      setLeverage(prev => Math.min(prev, assetInfo.maxLeverage));
      
      if (orderType === 'limit') {
        setPrice(currentPrice || '');
      }
    }
  }, [coin, assetInfo.maxLeverage]);

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

  // Get execution price for market orders with 10% slippage
  const getMarketPriceWithSlippage = () => {
    if (orderbook && orderbook.levels) {
      const asks = orderbook.levels[1];
      const bids = orderbook.levels[0];

      if (side === 'buy' && asks.length > 0) {
        const lowestAsk = parseFloat(asks[0].px);
        const priceWithSlippage = lowestAsk * 1.10; // 10% slippage for illiquid markets
        const marketPrice = formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
        console.log('[PerpOrderTicket] Buy execution price:', marketPrice, '(lowest ask:', lowestAsk, ')');
        return marketPrice;
      } else if (side === 'sell' && bids.length > 0) {
        const highestBid = parseFloat(bids[0].px);
        const priceWithSlippage = highestBid * 0.90; // 10% slippage for illiquid markets
        const marketPrice = formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
        console.log('[PerpOrderTicket] Sell execution price:', marketPrice, '(highest bid:', highestBid, ')');
        return marketPrice;
      }
    }

    // Fallback to mid price with 10% slippage if orderbook not available
    if (!currentPrice) {
      return '';
    }

    const midPrice = parseFloat(currentPrice);
    if (side === 'buy') {
      const priceWithSlippage = midPrice * 1.10;
      return formatPrice(priceWithSlippage, assetInfo.szDecimals, false);
    } else {
      const priceWithSlippage = midPrice * 0.90;
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

  const handleSubmit = async () => {
    if (!exchangeClient) {
      setError('Wallet not connected');
      return;
    }

    if (!price || !marginRequired) {
      setError('Please enter price and margin amount');
      return;
    }

    // Check if market has a valid index (HIP-3 markets may have -1 if not loaded from meta)
    if (assetInfo.market && assetInfo.market.index < 0) {
      setError(`Market ${coin} is not available for trading yet. Please try again later.`);
      console.error(`[PerpOrderTicket] Cannot trade market with invalid index: ${coin}, dex: ${assetInfo.dex}`);
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
      // HIP-3 markets are isolated-only, force isolated margin
      const isHip3 = assetInfo.dex && assetInfo.dex !== '';
      const effectiveMarginType = isHip3 ? 'isolated' : marginType;

      if (isHip3 && marginType === 'cross') {
        console.log('[PerpOrderTicket] HIP-3 market detected, forcing isolated margin');
      }

      // Get dex-specific client for HIP-3 markets (required for non-USDC collateral dexes like vntl)
      const client = getExchangeClientForDex(assetInfo.dex);
      if (!client) {
        throw new Error('Failed to get exchange client for this market');
      }

      console.log('[PerpOrderTicket] Updating leverage - Asset:', assetInfo.index, 'Leverage:', leverage, 'Is Cross:', effectiveMarginType === 'cross', 'Dex:', assetInfo.dex || 'default');

      await client.updateLeverage({
        asset: assetInfo.index,
        isCross: effectiveMarginType === 'cross',
        leverage,
      });
      console.log('[PerpOrderTicket] ✓ Leverage updated');

      const sizeValue = orderStats.size;
      // For market orders, use price with slippage for execution
      const executionPrice = orderType === 'market' ? getMarketPriceWithSlippage() : price;
      const priceValue = parseFloat(executionPrice);

      console.log('[PerpOrderTicket] Formatting - Raw Size:', sizeValue, 'Raw Price:', priceValue, 'szDecimals:', assetInfo.szDecimals);

      const formattedSize = formatSize(sizeValue, assetInfo.szDecimals, priceValue);
      const formattedPrice = formatPrice(priceValue, assetInfo.szDecimals);
      
      console.log('[PerpOrderTicket] Formatted Size:', formattedSize, 'Formatted Price:', formattedPrice);

      const finalTif = orderType === 'market' ? 'Ioc' : tif;

      // Log order context
      console.log('[PerpOrderTicket] Order context:', {
        coin,
        dex: assetInfo.dex || 'default',
        assetId: assetInfo.index,
        metaIndex: assetInfo.market?.index,
        side,
        orderType,
        price: formattedPrice,
        size: formattedSize,
      });

      const orderPayload: any = {
        orders: [{
          a: assetInfo.index, // Now contains the correct HIP-3 asset ID if applicable
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

      logApiCall('order (perp)', `${side} ${orderType} - ${coin} (dex: ${assetInfo.dex || 'default'})`);
      logUserAction('PerpOrderTicket', 'Submit order', `${side} ${orderType} ${coin}`);

      const result = await client.order(orderPayload);
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
          
          await client.order(tpOrderPayload);
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
          
          await client.order(slOrderPayload);
          console.log('[PerpOrderTicket] ✓ SL order placed');
        }
      }
      
      // Clear form
      setPrice(orderType === 'market' ? getDisplayPrice() : currentPrice || '');
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
      
      handleClose();
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

    // Calculate and sync slider position
    if (tradeableBalance && tradeableBalance > 0) {
      const percent = (margin / tradeableBalance) * 100;
      setSizePercent(Math.min(100, percent));
    } else {
      setSizePercent(0);
    }
  };
  
  // Update market order price when side, currentPrice, or orderbook changes
  useEffect(() => {
    if (orderType === 'market') {
      const displayPrice = getDisplayPrice();
      if (displayPrice) {
        setPrice(displayPrice);
      }
    }
  }, [orderType, side, currentPrice, orderbook]);

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
            <CloseButton onPress={handleClose} />
            
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
              collateral={getHip3Collateral(assetInfo.dex)}
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


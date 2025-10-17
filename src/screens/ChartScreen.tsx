import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Linking,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import LightweightChartBridge, { LWCandle } from '../components/chart/LightweightChartBridge';
import OrderTicket from '../components/OrderTicket';
import SpotOrderTicket from '../components/SpotOrderTicket';
import TPSLEditModal from '../components/TPSLEditModal';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useWallet } from '../contexts/WalletContext';
import { resolveSubscriptionCoin } from '../lib/markets';
import { generateTickSizeOptions, calculateMantissa, calculateNSigFigs } from '../lib/tickSize';
import { formatPrice as formatPriceForOrder, formatSize as formatSizeForOrder } from '../lib/formatting';
import type { Candle, CandleInterval } from '../types';
import { styles } from './styles/ChartScreen.styles';
import Color from '../styles/colors';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Helper function to format large numbers
function formatLargeNumber(num: number | string): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

// Helper function to format price with commas
function formatPrice(price: number | string): string {
  const value = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(value)) return '0';
  
  // Determine decimal places based on price magnitude
  let decimals = 2;
  if (value < 0.01) {
    decimals = 6;
  } else if (value < 1) {
    decimals = 4;
  } else if (value < 100) {
    decimals = 2;
  } else if (value >= 1000) {
    decimals = 1;
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Helper function to format percentage
function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

// Helper function to format numbers
function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

// Helper function to calculate unrealized PnL
function calculateUnrealizedPnL(position: any, currentPrice: number | string): { pnl: number; pnlPercent: number } {
  const positionSize = parseFloat(position.szi);
  const entryPrice = parseFloat(position.entryPx);
  const markPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  
  if (isNaN(positionSize) || isNaN(entryPrice) || isNaN(markPrice)) {
    return { pnl: 0, pnlPercent: 0 };
  }
  
  // PnL calculation: size * (current_price - entry_price)
  // Positive size = long, negative size = short
  const pnl = positionSize * (markPrice - entryPrice);
  
  // PnL percentage: (pnl / (abs(size) * entry_price)) * 100
  const pnlPercent = (pnl / (Math.abs(positionSize) * entryPrice)) * 100;
  
  return { pnl, pnlPercent };
}

export default function ChartScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { state, infoClient, subscribeToCandles, unsubscribeFromCandles, subscribeToOrderbook, unsubscribeFromOrderbook, subscribeToTrades, unsubscribeFromTrades } =
    useWebSocket();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { selectedCoin, marketType, spotMarkets } = state;

  const [candles, setCandles] = useState<ChartData[]>([]);
  const [interval, setInterval] = useState<CandleInterval>('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'orderbook' | 'trades'>('orderbook');
  const [tickSize, setTickSize] = useState<number | null>(null);
  const [showTickDropdown, setShowTickDropdown] = useState(false);
  const [showOrderTicket, setShowOrderTicket] = useState(false);
  const [orderTicketDefaultSide, setOrderTicketDefaultSide] = useState<'buy' | 'sell'>('buy');
  const [closingPosition, setClosingPosition] = useState<boolean>(false);
  const [cancelingOrder, setCancelingOrder] = useState<number | null>(null);
  const [editingTPSL, setEditingTPSL] = useState<any | null>(null);

  // Price color animation
  const previousPrice = useRef<number | null>(null);
  const priceDirection = useRef<'up' | 'down' | null>(null);
  const colorAnimation = useRef(new Animated.Value(0)).current;

  // Get current asset's market data for szDecimals
  const perpMarket = marketType === 'perp'
    ? state.perpMarkets.find(m => m.name === selectedCoin)
    : null;

  // Get real-time price from WebSocket
  const assetCtx = state.assetContexts[selectedCoin || ''] || null;
  const currentPriceForTick = (selectedCoin && state.prices[selectedCoin]) 
    ? parseFloat(state.prices[selectedCoin])
    : (assetCtx?.markPx || 0);

  // Calculate tick size options based on current price and szDecimals
  const tickSizeOptions = useMemo(() => {
    if (!currentPriceForTick || currentPriceForTick === 0) {
      return [];
    }
    
    if (marketType === 'perp' && perpMarket) {
      return generateTickSizeOptions(currentPriceForTick, perpMarket.szDecimals, false);
    }
    
    // For spot, default to szDecimals=2 (can be refined later)
    return generateTickSizeOptions(currentPriceForTick, 2, true);
  }, [marketType, perpMarket, selectedCoin, currentPriceForTick]);

  // Reset tick size when coin changes
  useEffect(() => {
    setTickSize(null);
  }, [selectedCoin]);

  // Set default tick size to minimum when options change
  useEffect(() => {
    if (tickSizeOptions.length > 0 && tickSize === null) {
      const minTick = tickSizeOptions[0].value; // First option is the minimum
      setTickSize(minTick);
    }
  }, [tickSizeOptions, tickSize]);

  // Calculate mantissa and nSigFigs from selected tick size
  const { mantissa, nSigFigs } = useMemo(() => {
    if (tickSize === null) {
      return { mantissa: undefined, nSigFigs: undefined };
    }
    const calculatedMantissa = calculateMantissa(tickSize);
    const calculatedNSigFigs = calculateNSigFigs(tickSize, tickSizeOptions);
    return {
      mantissa: calculatedMantissa,
      nSigFigs: calculatedNSigFigs,
    };
  }, [tickSize, tickSizeOptions]);

  const fetchHistoricalCandles = useCallback(
    async (coin: string, candleInterval: CandleInterval) => {
      if (!infoClient) return;

      try {
        setIsLoading(true);
        setError(null);

        const subscriptionCoin = resolveSubscriptionCoin(
          marketType,
          coin,
          spotMarkets
        );

        const endTime = Date.now();
        // generous lookback to fetch max candles server allows
        const lookbacks: Record<CandleInterval, number> = {
          '1m': 90,
          '5m': 180,
          '15m': 365,
          '1h': 365 * 2,
          '4h': 365 * 4,
          '1d': 365 * 8,
        };
        const startTime = endTime - lookbacks[candleInterval] * 24 * 60 * 60 * 1000;

        console.log('[Phase 5] Fetching candle snapshot:', {
          coin: subscriptionCoin,
          interval: candleInterval,
        });

        const snapshot = await infoClient.candleSnapshot({
          coin: subscriptionCoin,
          interval: candleInterval,
          startTime,
          endTime,
        });

        if (snapshot && Array.isArray(snapshot)) {
          const chartData: ChartData[] = snapshot.map((c: any) => ({
            timestamp: c.t,
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
          }));

          chartData.sort((a, b) => a.timestamp - b.timestamp);
          setCandles(chartData);
          console.log('[Phase 5] ✓ Loaded', chartData.length, 'candles');
        }
      } catch (err: any) {
        console.error('[Phase 5] Error fetching candles:', err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    },
    [infoClient, marketType, spotMarkets]
  );

  useEffect(() => {
    if (!selectedCoin) return;

    fetchHistoricalCandles(selectedCoin, interval);

    const handleLiveCandle = (candle: Candle): void => {
      setCandles((prev) => {
        const newCandle: ChartData = {
          timestamp: candle.t,
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
        };

        const existingIndex = prev.findIndex(
          (c) => c.timestamp === newCandle.timestamp
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newCandle;
          return updated;
        } else {
          return [...prev, newCandle].sort((a, b) => a.timestamp - b.timestamp);
        }
      });
    };

    subscribeToCandles(selectedCoin, interval, handleLiveCandle);
    subscribeToOrderbook(selectedCoin, { mantissa, nSigFigs });
    subscribeToTrades(selectedCoin);

    return () => {
      unsubscribeFromCandles();
      unsubscribeFromOrderbook();
      unsubscribeFromTrades();
    };
  }, [
    selectedCoin,
    interval,
    subscribeToCandles,
    unsubscribeFromCandles,
    subscribeToOrderbook,
    unsubscribeFromOrderbook,
    subscribeToTrades,
    unsubscribeFromTrades,
    fetchHistoricalCandles,
    mantissa,
    nSigFigs,
    // Note: tickSize is not included because mantissa/nSigFigs are derived from it
  ]);

  const handleIntervalChange = (newInterval: CandleInterval): void => {
    setInterval(newInterval);
  };

  if (!selectedCoin) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No coin selected</Text>
          <Text style={styles.emptySubtext}>
            Select a coin from the Search tab
          </Text>
        </View>
      </View>
    );
  }

  const lwcCandles: LWCandle[] = candles.map((c) => ({
    time: Math.floor(c.timestamp / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  // Asset info and position/balance and per-ticker history (basic pass)
  const perpPosition = account.data?.perpPositions?.find?.((p: any) => p.coin === selectedCoin);
  const spotBalances = account.data?.spotBalances || [];
  const userFills = (account.data?.userFills || []).filter((f: any) => f.coin === selectedCoin);

  // Get real-time price from WebSocket (same as SearchScreen)
  // Access directly from state.prices to ensure updates trigger re-renders
  const currentPrice = (selectedCoin && state.prices[selectedCoin]) || assetCtx?.markPx;

  // Debug: Log price updates
  useEffect(() => {
    if (selectedCoin && state.prices[selectedCoin]) {
      console.log('[ChartScreen] Price update:', selectedCoin, state.prices[selectedCoin]);
    }
  }, [selectedCoin, state.prices]);

  // Animate price color on change
  useEffect(() => {
    if (currentPrice != null) {
      const currentPriceNum = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
      
      if (previousPrice.current !== null && previousPrice.current !== currentPriceNum) {
        // Determine direction
        if (currentPriceNum > previousPrice.current) {
          priceDirection.current = 'up';
        } else if (currentPriceNum < previousPrice.current) {
          priceDirection.current = 'down';
        }

        // Reset animation and animate from colored to default
        colorAnimation.setValue(0);
        Animated.timing(colorAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
      
      previousPrice.current = currentPriceNum;
    }
  }, [currentPrice, colorAnimation]);

  // Calculate 24h change using useMemo to avoid unnecessary recalculations
  const change24h = useMemo(() => {
    if (!assetCtx?.prevDayPx || !currentPrice) return null;
    const current = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    const prev = typeof assetCtx.prevDayPx === 'string' ? parseFloat(assetCtx.prevDayPx) : assetCtx.prevDayPx;
    return ((current - prev) / prev) * 100;
  }, [assetCtx?.prevDayPx, currentPrice]);

  // Get leverage for perps
  const maxLeverage = perpMarket?.maxLeverage;

  // Calculate true open interest in USD (OI in tokens * price)
  const openInterestUSD = useMemo(() => {
    if (!assetCtx?.openInterest || !currentPrice) return null;
    const oi = typeof assetCtx.openInterest === 'string' ? parseFloat(assetCtx.openInterest) : assetCtx.openInterest;
    const price = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    return oi * price;
  }, [assetCtx?.openInterest, currentPrice]);

  // Interpolate price color based on animation and direction
  const animatedPriceColor = colorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: priceDirection.current === 'up' 
      ? [Color.BRIGHT_ACCENT, Color.FG_1]  // Green to white
      : priceDirection.current === 'down'
      ? [Color.RED, Color.FG_1]  // Red to white
      : [Color.FG_1, Color.FG_1],  // Default white
  });

  // Handle close position
  const handleClosePosition = async () => {
    if (!perpPosition || !selectedCoin) return;
    
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const positionSize = parseFloat(perpPosition.szi);
    
    // Get market info for asset index and szDecimals
    const market = state.perpMarkets.find(m => m.name === selectedCoin);
    if (!market) {
      Alert.alert('Error', `Asset ${selectedCoin} not found in markets`);
      return;
    }
    
    const assetIndex = market.index;
    const szDecimals = market.szDecimals || 4;

    // Get current price
    const priceValue = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    if (!priceValue) {
      Alert.alert('Error', `No price available for ${selectedCoin}`);
      return;
    }

    // Calculate execution price with 0.1% slippage
    let executionPrice: number;
    if (positionSize > 0) {
      // Closing long: SELL at lower price
      executionPrice = priceValue * 0.999;
    } else {
      // Closing short: BUY at higher price
      executionPrice = priceValue * 1.001;
    }

    // Show confirmation
    Alert.alert(
      `Close ${selectedCoin} Position?`,
      `Size: ${Math.abs(positionSize).toFixed(szDecimals)}\n` +
      `Side: ${positionSize > 0 ? 'Sell (close long)' : 'Buy (close short)'}\n` +
      `Mid Price: $${priceValue.toFixed(2)}\n` +
      `Execution Price: $${executionPrice.toFixed(2)} (${positionSize > 0 ? '-0.1%' : '+0.1%'} slippage)\n\n` +
      `This will submit a reduce-only market order.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close Position',
          style: 'destructive',
          onPress: async () => {
            setClosingPosition(true);

            try {
              const formattedPrice = formatPriceForOrder(executionPrice, szDecimals, true);
              const formattedSize = formatSizeForOrder(Math.abs(positionSize), szDecimals, priceValue);
              
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

              console.log('[ChartScreen] Closing position:', selectedCoin);
              console.log('[ChartScreen] Order payload:', JSON.stringify(orderPayload, null, 2));

              const result = await exchangeClient.order(orderPayload);

              console.log('[ChartScreen] ✓ Close order placed:', result);
              Alert.alert('Success', 'Position closing order submitted!');
              
              // Refetch account data
              setTimeout(() => refetchAccount(), 2000);
            } catch (err: any) {
              console.error('[ChartScreen] Failed to close position:', err);
              Alert.alert('Error', `Failed to close position: ${err.message}`);
            } finally {
              setClosingPosition(false);
            }
          },
        },
      ]
    );
  };

  // Handle cancel order
  const handleCancelOrder = async (coin: string, oid: number) => {
    if (!exchangeClient || !selectedCoin) return;
    
    // Get market info
    const perpMarket = state.perpMarkets.find(m => m.name === coin);
    const spotMarket = state.spotMarkets.find(m => m.name === coin || m.apiName === coin);
    
    // Determine asset index
    let assetIndex: number;
    if (marketType === 'perp' && perpMarket) {
      assetIndex = perpMarket.index;
    } else if (marketType === 'spot' && spotMarket) {
      assetIndex = 10000 + spotMarket.index; // Spot orders need +10000
    } else {
      Alert.alert('Error', `Asset ${coin} not found in markets`);
      return;
    }

    // Show confirmation
    Alert.alert(
      `Cancel Order for ${coin}?`,
      `Order ID: ${oid}\n\nThis will cancel the limit order.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setCancelingOrder(oid);

            try {
              const cancelPayload = {
                cancels: [{
                  a: assetIndex,
                  o: oid,
                }],
              };

              console.log('[ChartScreen] Canceling order:', { coin, oid, assetIndex, marketType });
              const result = await exchangeClient.cancel(cancelPayload);

              console.log('[ChartScreen] ✓ Order canceled:', result);
              Alert.alert('Success', 'Order canceled successfully!');
              
              // Refetch account data
              setTimeout(() => refetchAccount(), 1000);
            } catch (err: any) {
              console.error('[ChartScreen] Failed to cancel order:', err);
              Alert.alert('Error', `Failed to cancel order: ${err.message}`);
            } finally {
              setCancelingOrder(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tickerHeader}>
        <View style={styles.backButtonRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tickerTopRow}>
          <View style={styles.tickerLeftGroup}>
            <Text style={styles.tickerName}>{selectedCoin}</Text>
            {marketType === 'perp' && maxLeverage && (
              <View style={styles.leverageBadge}>
                <Text style={styles.leverageText}>{maxLeverage}x</Text>
              </View>
            )}
          </View>
          <View style={styles.priceRightGroup}>
            {currentPrice != null && (
              <Animated.Text style={[styles.currentPrice, { color: animatedPriceColor }]}>
                ${formatPrice(currentPrice)}
              </Animated.Text>
            )}
            {change24h != null && (
              <Text style={change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative}>
                {formatPercentage(change24h)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.tickerBottomRow}>
          <Text style={styles.marketTypeLabel}>
            {marketType === 'perp' ? 'Perpetual' : 'Spot'}
          </Text>
          <View style={styles.statsRowContainer}>
            {assetCtx?.dayNtlVlm != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24h Vol: </Text>
                <Text style={styles.statValue}>${formatLargeNumber(assetCtx.dayNtlVlm)}</Text>
              </View>
            )}
            {marketType === 'perp' && assetCtx?.funding != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Funding: </Text>
                <Text style={assetCtx.funding >= 0 ? styles.statValuePositive : styles.statValueNegative}>
                  {formatPercentage(assetCtx.funding * 100, 4)}
                </Text>
              </View>
            )}
            {marketType === 'perp' && openInterestUSD != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>OI: </Text>
                <Text style={styles.statValue}>${formatLargeNumber(openInterestUSD)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >

        <View style={styles.chartIntervalHeader}>
          {INTERVALS.map((int) => (
            <TouchableOpacity
              key={int}
              onPress={() => handleIntervalChange(int)}
              style={styles.chartIntervalButton}
            >
              <Text
                style={[
                  styles.chartIntervalText,
                  interval === int && styles.chartIntervalTextActive,
                ]}
              >
                {int.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Image 
              source={require('../../assets/blob_green.gif')} 
              style={styles.loadingGif}
            />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {!isLoading && !error && candles.length > 0 && (
          <View style={styles.chartContainer}>
            <LightweightChartBridge candles={lwcCandles} smaPeriod={20} height={400} />
          </View>
        )}

        {!isLoading && !error && candles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data available</Text>
            <Text style={styles.emptySubtext}>
              Try selecting a different interval or coin
            </Text>
          </View>
        )}

        <View style={styles.separator} />

        {/* Orderbook / Trades toggle panel */}
        <View>
          <View style={styles.panelSelector}>
            <TouchableOpacity
              style={[styles.intervalButton, panel === 'orderbook' && styles.intervalButtonActive]}
              onPress={() => setPanel('orderbook')}
            >
              <Text style={[styles.intervalText, panel === 'orderbook' && styles.intervalTextActive]}>Order Book</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.intervalButton, panel === 'trades' && styles.intervalButtonActive]}
              onPress={() => setPanel('trades')}
            >
              <Text style={[styles.intervalText, panel === 'trades' && styles.intervalTextActive]}>Trades</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.separatorContainer}>
            <View style={[styles.separatorSegment, panel === 'orderbook' && styles.separatorActive]} />
            <View style={[styles.separatorSegment, panel === 'trades' && styles.separatorActive]} />
          </View>
        </View>

        {panel === 'orderbook' && (
          <View style={styles.chartContainer}>
            {state.orderbook ? (
              <View>
                <View style={styles.obHeader}>
                  <Text style={styles.obColTextPrice}>Price</Text>
                  <View style={styles.obColumnsWithDropdown}>
                    <TouchableOpacity 
                      style={styles.tickDropdownButton}
                      onPress={() => setShowTickDropdown(true)}
                    >
                      <Text style={styles.tickDropdownValue}>
                        {tickSize ? tickSizeOptions.find(opt => opt.value === tickSize)?.label : 'Auto'}
                      </Text>
                      <Text style={styles.tickDropdownArrow}>▼</Text>
                    </TouchableOpacity>
                    <Text style={styles.obColTextSize}>Size</Text>
                  </View>
                </View>

                <Modal
                  visible={showTickDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowTickDropdown(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTickDropdown(false)}
                  >
                    <View style={styles.tickDropdownMenu}>
                      <ScrollView>
                        {tickSizeOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.tickDropdownItem,
                              tickSize === option.value && styles.tickDropdownItemActive,
                            ]}
                            onPress={() => {
                              setTickSize(option.value);
                              setShowTickDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.tickDropdownItemText,
                                tickSize === option.value && styles.tickDropdownItemTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {(() => {
                  // ASKS - sorted descending by price (highest first)
                  const askLevels = [...state.orderbook.levels[1]]
                    .sort((a, b) => parseFloat(b.px) - parseFloat(a.px))
                    .slice(0, 15);
                  // Cumulative depth accumulates from bottom up (lowest ask to highest)
                  const askCumulativeDepths = askLevels.map((_, idx) => 
                    askLevels.slice(idx).reduce((sum, l) => sum + parseFloat(l.sz || '0'), 0)
                  );
                  const maxAskDepth = Math.max(...askCumulativeDepths, 1);

                  return askLevels.map((l, idx) => {
                    const depth = Math.min(1, askCumulativeDepths[idx] / maxAskDepth);
                    return (
                      <View key={`ask-${idx}`} style={styles.obRow}>
                        <View style={[styles.obDepthAsk, { width: `${Math.round(depth * 100)}%` }]} />
                        <Text style={styles.obPx}>{formatPrice(l.px)}</Text>
                        <Text style={styles.obSz}>{l.sz}</Text>
                      </View>
                    );
                  });
                })()}

                {(() => {
                  // BIDS - sorted descending by price (highest first)
                  const bidLevels = [...state.orderbook.levels[0]]
                    .sort((a, b) => parseFloat(b.px) - parseFloat(a.px))
                    .slice(0, 15);
                  const bidCumulativeDepths = bidLevels.map((_, idx) => 
                    bidLevels.slice(0, idx + 1).reduce((sum, l) => sum + parseFloat(l.sz || '0'), 0)
                  );
                  const maxBidDepth = Math.max(...bidCumulativeDepths, 1);

                  return bidLevels.map((l, idx) => {
                    const depth = Math.min(1, bidCumulativeDepths[idx] / maxBidDepth);
                    return (
                      <View key={`bid-${idx}`} style={styles.obRow}>
                        <View style={[styles.obDepthBid, { width: `${Math.round(depth * 100)}%` }]} />
                        <Text style={styles.obPx}>{formatPrice(l.px)}</Text>
                        <Text style={styles.obSz}>{l.sz}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            ) : (
              <View style={styles.orderbookLoadingContainer}>
                <Image 
                  source={require('../../assets/blob_green.gif')} 
                  style={styles.loadingGif}
                />
              </View>
            )}
          </View>
        )}

        {panel === 'trades' && (
          <View style={styles.chartContainer}>
            {state.recentTrades.length > 0 ? (
              <View>
                <View style={styles.tradesHeader}>
                  <Text style={styles.obColText}>Price</Text>
                  <Text style={styles.obColText}>Size</Text>
                  <Text style={styles.obColText}>Time</Text>
                </View>
                {state.recentTrades.slice(0, 32).map((t, idx) => {
                  const tradeTime = new Date(t.time);
                  const timeStr = `${String(tradeTime.getHours()).padStart(2, '0')}:${String(tradeTime.getMinutes()).padStart(2, '0')}:${String(tradeTime.getSeconds()).padStart(2, '0')}`;
                  const isBuy = t.side === 'B'; // B = Bid (buy), A = Ask (sell)
                  
                  return (
                    <View key={`trade-${idx}-${t.tid}`} style={styles.tradeRow}>
                      <Text style={[styles.tradePrice, isBuy ? styles.tradePriceBid : styles.tradePriceAsk]}>
                        {formatPrice(t.px)}
                      </Text>
                      <Text style={styles.tradeSize}>
                        {t.sz}
                      </Text>
                      <View style={styles.tradeTimeContainer}>
                        <Text style={styles.tradeTime}>{timeStr}</Text>
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`https://app.hyperliquid.xyz/explorer/tx/${t.hash}`)}
                        >
                          <Text style={styles.tradeExplorerLink}>↗</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.subtitle}>Loading trades...</Text>
            )}
          </View>
        )}


        {/* Position / Balances */}
        <View style={styles.positionsContainer}>
          <Text style={styles.sectionLabel}>
            {marketType === 'perp' ? 'Open Position' : 'Spot Balances'}
          </Text>
          {marketType === 'perp' ? (
            perpPosition ? (
              (() => {
                const positionSize = parseFloat(perpPosition.szi);
                const isLong = positionSize > 0;
                const leverage = perpPosition.leverage?.value || 1;
                const price = currentPrice ? (typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice) : 0;
                const { pnl, pnlPercent } = currentPrice != null 
                  ? calculateUnrealizedPnL(perpPosition, currentPrice)
                  : { pnl: 0, pnlPercent: 0 };
                
                // Calculate 24h change
                const prevDayPx = assetCtx?.prevDayPx || price;
                const priceChange = price - prevDayPx;
                const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                
                // Calculate margin used
                const marginUsed = perpPosition.marginUsed 
                  ? parseFloat(perpPosition.marginUsed)
                  : parseFloat(perpPosition.positionValue || '0') / leverage;
                
                // Format TP/SL display
                const tpDisplay = perpPosition.tpPrice ? perpPosition.tpPrice.toFixed(2) : '--';
                const slDisplay = perpPosition.slPrice ? perpPosition.slPrice.toFixed(2) : '--';
                
                return (
                  <>
                    <View style={styles.positionCell}>
                      <View style={styles.leftSide}>
                        <View style={styles.tickerContainer}>
                          <Text style={styles.ticker}>{selectedCoin}</Text>
                          <Text style={[
                            styles.leverage,
                            { color: isLong ? Color.BRIGHT_ACCENT : Color.RED }
                          ]}>
                            {leverage}x
                          </Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.size}>${formatPrice(price)}</Text>
                          <Text style={[
                            styles.priceChange,
                            { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                          ]}>
                            {formatPercentage(priceChangePct * 100)}
                          </Text>
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => setEditingTPSL(perpPosition)}
                          >
                            <Text style={styles.tpslInline}>TP/SL {tpDisplay}/{slDisplay}</Text>
                            <MaterialIcons name="edit" size={14} color={Color.BRIGHT_ACCENT} style={styles.editTpslIcon} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.rightSide}>
                        <Text style={styles.price}>${formatNumber(marginUsed, 2)}</Text>
                        <Text style={[
                          styles.pnl,
                          { color: pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                        ]}>
                          {pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(pnl), 2)}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      onPress={handleClosePosition}
                      disabled={closingPosition}
                      style={styles.marketCloseButton}
                    >
                      <Text style={styles.marketCloseText}>
                        {closingPosition ? 'Closing...' : 'Market Close'}
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()
            ) : (
              <Text style={styles.subtitle}>No open perp position</Text>
            )
          ) : (
            <>
              {spotBalances.length > 0 ? (
                spotBalances
                  .filter((b: any) => parseFloat(b.total) > 0)
                  .slice(0, 4)
                  .map((b: any, idx: number) => {
                    const balance = parseFloat(b.total);
                    let coinPrice, usdValue;
                    if (b.coin === 'USDC') {
                      coinPrice = 1;
                      usdValue = balance;
                    } else {
                      const price = state.prices[b.coin];
                      coinPrice = price ? parseFloat(price) : 0;
                      usdValue = price ? balance * parseFloat(price) : 0;
                    }
                    
                    // Calculate 24h change
                    const assetContext = state.assetContexts[b.coin];
                    const prevDayPx = assetContext?.prevDayPx || coinPrice;
                    const priceChange = coinPrice - prevDayPx;
                    const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;
                    
                    return (
                      <View key={`bal-${idx}`}>
                        <View style={styles.positionCell}>
                          <View style={styles.leftSide}>
                            <View style={styles.tickerContainer}>
                              <Text style={styles.ticker}>{b.coin}</Text>
                            </View>
                            <View style={styles.priceContainer}>
                              <Text style={styles.size}>${formatNumber(coinPrice)}</Text>
                              <Text style={[
                                styles.priceChange,
                                { color: priceChangePct >= 0 ? Color.BRIGHT_ACCENT : Color.RED }
                              ]}>
                                {formatPercentage(priceChangePct * 100)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.rightSide}>
                            <Text style={styles.price}>${formatNumber(usdValue, 2)}</Text>
                            <Text style={[styles.pnl, { color: Color.FG_3 }]}>
                              {formatNumber(balance, 4)} {b.coin}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cellSeparator} />
                      </View>
                    );
                  })
              ) : (
                <Text style={styles.subtitle}>No balances</Text>
              )}
            </>
          )}
        </View>

        {/* Open Orders for current ticker/market */}
        {(() => {
          const openOrders = account.data?.openOrders || [];
          
          // Helper to get display name for spot orders (converts @{index} to display name)
          const getDisplayName = (coin: string) => {
            const spotMarket = state.spotMarkets.find(m => m.name === coin || m.apiName === coin);
            if (spotMarket) return spotMarket.name;
            return coin;
          };
          
          // Filter orders for current ticker and market type
          const currentTickerOrders = openOrders.filter((order: any) => {
            // Check if order coin matches selectedCoin directly (for perp orders)
            if (order.coin === selectedCoin) return true;
            
            // For spot orders, the order.coin is in @{index} format
            // Check if the apiName of current selected coin matches the order coin
            const spotMarket = state.spotMarkets.find(m => m.name === selectedCoin);
            if (spotMarket && order.coin === spotMarket.apiName) return true;
            
            return false;
          });
          
          return currentTickerOrders.length > 0 && (
            <View style={styles.openOrdersContainer}>
              <Text style={styles.sectionLabel}>
                Open Orders ({currentTickerOrders.length})
              </Text>
              {currentTickerOrders.map((order: any) => {
                const displayName = getDisplayName(order.coin);
                
                return (
                  <View key={`order-${order.oid}`}>
                    <View style={styles.orderCard}>
                      <View style={styles.orderLeftSide}>
                        <View style={styles.orderCoinContainer}>
                          <Text style={styles.orderCoin}>{displayName}</Text>
                          <Text style={[
                            styles.orderSide,
                            order.side === 'B' ? styles.sideBuy : styles.sideSell
                          ]}>
                            {order.side === 'B' ? 'BUY' : 'SELL'}
                          </Text>
                        </View>
                        <View style={styles.orderDetails}>
                          <Text style={styles.orderPrice}>${order.limitPx}</Text>
                          <Text style={styles.orderSize}>{order.sz}</Text>
                        </View>
                      </View>
                      <View style={styles.orderRightSide}>
                        <TouchableOpacity
                          style={styles.cancelOrderButton}
                          onPress={() => handleCancelOrder(order.coin, order.oid)}
                          disabled={cancelingOrder === order.oid}
                        >
                          <Text style={styles.cancelOrderButtonText}>
                            {cancelingOrder === order.oid ? 'Canceling...' : 'Cancel'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.cellSeparator} />
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* Trade history (per ticker, filtered by market type) */}
        <View style={styles.recentTradesContainer}>
          <Text style={styles.sectionLabel}>Recent Trades</Text>
          {(() => {
            // Filter trades by market type
            const perpCoins = new Set(state.perpMarkets.map(m => m.name));
            const spotCoins = new Set(state.spotMarkets.map(m => m.name.split('/')[0]));
            
            const filteredTrades = userFills.filter(fill => {
              if (marketType === 'perp') {
                return perpCoins.has(fill.coin);
              } else {
                return spotCoins.has(fill.coin);
              }
            });
            
            return filteredTrades.length > 0 ? (
              filteredTrades.slice(0, 10).map((fill: any, idx: number) => (
                <View key={`fill-${idx}`}>
                  <View style={styles.tradeCard}>
                    <View style={styles.tradeLeftSide}>
                      <View style={styles.tradeTopRow}>
                        <Text style={styles.tradeCoin}>{fill.coin}</Text>
                        <Text style={[
                          styles.tradeSide,
                          fill.side === 'B' ? styles.sideBuy : styles.sideSell
                        ]}>
                          {fill.side === 'B' ? 'BUY' : 'SELL'}
                        </Text>
                        {fill.closedPnl && parseFloat(fill.closedPnl) !== 0 && (
                          <Text style={[
                            styles.tradePnl,
                            parseFloat(fill.closedPnl) >= 0 ? styles.pnlPositive : styles.pnlNegative
                          ]}>
                            {parseFloat(fill.closedPnl) >= 0 ? '+' : ''}${parseFloat(fill.closedPnl).toFixed(2)}
                          </Text>
                        )}
                      </View>
                      {fill.time && (
                        <Text style={styles.tradeCardTime}>
                          {new Date(fill.time).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                    <View style={styles.tradeRightSide}>
                      <Text style={styles.tradeCardPrice}>${formatNumber(parseFloat(fill.px), 2)}</Text>
                      <Text style={styles.tradeCardSize}>{fill.sz}</Text>
                    </View>
                  </View>
                  <View style={styles.cellSeparator} />
                </View>
              ))
            ) : (
              <Text style={styles.subtitle}>No trades for this market type</Text>
            );
          })()}
        </View>
      </ScrollView>

      {/* Sticky Buy/Sell Buttons */}
      <View style={styles.orderButtonsContainer}>
        <TouchableOpacity
          style={[styles.orderButton, styles.orderButtonBuy]}
          onPress={() => {
            setOrderTicketDefaultSide('buy');
            setShowOrderTicket(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.orderButtonTextBuy}>BUY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.orderButton, styles.orderButtonSell]}
          onPress={() => {
            setOrderTicketDefaultSide('sell');
            setShowOrderTicket(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.orderButtonTextSell}>SELL</Text>
        </TouchableOpacity>
      </View>

      {/* Order Ticket Modal - Conditional based on market type */}
      {marketType === 'perp' ? (
        <OrderTicket
          visible={showOrderTicket}
          onClose={() => setShowOrderTicket(false)}
          defaultSide={orderTicketDefaultSide}
        />
      ) : (
        <SpotOrderTicket
          visible={showOrderTicket}
          onClose={() => setShowOrderTicket(false)}
          defaultSide={orderTicketDefaultSide}
        />
      )}
      
      {/* TP/SL Edit Modal */}
      {editingTPSL && (
        <TPSLEditModal
          visible={!!editingTPSL}
          onClose={() => setEditingTPSL(null)}
          position={editingTPSL}
          currentPrice={typeof currentPrice === 'string' ? parseFloat(currentPrice) : (currentPrice || 0)}
        />
      )}
    </View>
  );
}


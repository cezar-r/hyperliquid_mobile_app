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
import { useNavigation } from '@react-navigation/native';
import LightweightChartBridge, { LWCandle } from '../components/chart/LightweightChartBridge';
import OrderTicket from '../components/OrderTicket';
import SpotOrderTicket from '../components/SpotOrderTicket';
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
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Position / Balances</Text>
          {marketType === 'perp' ? (
            perpPosition ? (
              (() => {
                const positionSize = parseFloat(perpPosition.szi);
                const isLong = positionSize > 0;
                const { pnl, pnlPercent } = currentPrice != null 
                  ? calculateUnrealizedPnL(perpPosition, currentPrice)
                  : { pnl: 0, pnlPercent: 0 };
                
                return (
                  <View>
                    <View style={styles.positionHeader}>
                      <Text style={[styles.positionDirection, isLong ? styles.positionLong : styles.positionShort]}>
                        {isLong ? 'LONG' : 'SHORT'}
                      </Text>
                      <Text style={styles.positionSize}>{Math.abs(positionSize).toFixed(4)}</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Entry Price:</Text>
                      <Text style={styles.positionValue}>${formatPrice(perpPosition.entryPx)}</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Mark Price:</Text>
                      <Text style={styles.positionValue}>${formatPrice(currentPrice || 0)}</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Unrealized PnL:</Text>
                      <Text style={[styles.positionPnl, pnl >= 0 ? styles.positionPnlPositive : styles.positionPnlNegative]}>
                        ${pnl.toFixed(2)} ({formatPercentage(pnlPercent)})
                      </Text>
                    </View>
                    {perpPosition.leverage?.value && (
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Leverage:</Text>
                        <Text style={styles.positionValue}>{perpPosition.leverage.value}x</Text>
                      </View>
                    )}
                    {perpPosition.liquidationPx && perpPosition.liquidationPx !== null && (
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Liq. Price:</Text>
                        <Text style={[styles.positionValue, styles.positionLiqPrice]}>${formatPrice(perpPosition.liquidationPx)}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.closeButton,
                        closingPosition && styles.closeButtonDisabled
                      ]}
                      onPress={handleClosePosition}
                      disabled={closingPosition}
                    >
                      <Text style={styles.closeButtonText}>
                        {closingPosition ? 'Closing...' : 'Close Position'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()
            ) : (
              <Text style={styles.subtitle}>No open perp position</Text>
            )
          ) : (
            <>
              {spotBalances.length > 0 ? (
                spotBalances
                  .filter((b: any) => b.total !== '0')
                  .slice(0, 4)
                  .map((b: any, idx: number) => {
                    const balance = parseFloat(b.total);
                    const coinPrice = state.prices[b.coin];
                    const usdValue = coinPrice ? balance * parseFloat(coinPrice) : null;
                    
                    return (
                      <View key={`bal-${idx}`} style={styles.balanceRow}>
                        <Text style={styles.balanceCoin}>{b.coin}:</Text>
                        <View style={styles.balanceValues}>
                          <Text style={styles.balanceAmount}>{balance.toFixed(6)}</Text>
                          {usdValue && (
                            <Text style={styles.balanceUsd}>${usdValue.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
              ) : (
                <Text style={styles.subtitle}>No balances</Text>
              )}
            </>
          )}
        </View>

        {/* Trade history (per ticker) */}
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Your Trades ({selectedCoin})</Text>
          {userFills.length > 0 ? (
            userFills.slice(0, 20).map((f: any, idx: number) => (
              <Text key={`fill-${idx}`} style={styles.infoText}>
                {f.side} {f.sz} @ {formatPrice(f.px)}
              </Text>
            ))
          ) : (
            <Text style={styles.subtitle}>No fills for this market</Text>
          )}
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
    </View>
  );
}


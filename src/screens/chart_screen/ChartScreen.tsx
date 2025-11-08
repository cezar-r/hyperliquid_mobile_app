import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Animated,
  InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LWCandle, ChartMarker, ChartPriceLine, LightweightChartBridgeRef } from '../../components/chart/LightweightChartBridge';
import OrderTicket from '../../components/OrderTicket';
import SpotOrderTicket from '../../components/SpotOrderTicket';
import TPSLEditModal from '../../components/TPSLEditModal';
import ClosePositionModal from '../../components/ClosePositionModal';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useWallet } from '../../contexts/WalletContext';
import { resolveSubscriptionCoin } from '../../lib/markets';
import { generateTickSizeOptions, calculateMantissa, calculateNSigFigs } from '../../lib/tickSize';
import { formatPrice as formatPriceForOrder, formatSize as formatSizeForOrder, getDisplayTicker } from '../../lib/formatting';
import { isTickerStarred, toggleStarredTicker } from '../../lib/starredTickers';
import type { Candle, CandleInterval } from '../../types';
import { styles } from './styles/ChartScreen.styles';
import Color from '../../styles/colors';
import SkeletonScreen from '../../components/SkeletonScreen';
import PanelSelector from '../../shared/components/panel_selector/PanelSelector';
import ChartHeader from './components/ChartHeader';
import ChartContent from './components/ChartContent';
import OrderBookContent from './components/OrderBookContent';
import TradesContent from './components/TradesContent';
import PositionContainer from './components/PositionContainer';
import OpenOrdersContainer from './components/OpenOrdersContainer';
import RecentTradesContainer from './components/RecentTradesContainer';
import BuySellButtons from './components/BuySellButtons';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const SHOW_TRADES_KEY = '@show_trades_on_chart';

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
  
  const pnl = positionSize * (markPrice - entryPrice);
  const pnlPercent = (pnl / (Math.abs(positionSize) * entryPrice)) * 100;
  
  return { pnl, pnlPercent };
}

export default function ChartScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { state, infoClient, subscribeToCandles, unsubscribeFromCandles, subscribeToOrderbook, unsubscribeFromOrderbook, subscribeToTrades, unsubscribeFromTrades } =
    useWebSocket();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { selectedCoin, marketType, spotMarkets } = state;

  // For skeleton loading
  const [isReady, setIsReady] = useState(false);

  const [candles, setCandles] = useState<ChartData[]>([]);
  const [interval, setInterval] = useState<CandleInterval | null>(null);
  const [intervalLoaded, setIntervalLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'chart' | 'orderbook' | 'trades'>('chart');
  const [tickSize, setTickSize] = useState<number | null>(null);
  const [showTickDropdown, setShowTickDropdown] = useState(false);
  const [showOrderTicket, setShowOrderTicket] = useState(false);
  const [orderTicketDefaultSide, setOrderTicketDefaultSide] = useState<'buy' | 'sell'>('buy');
  const [closingPosition, setClosingPosition] = useState<boolean>(false);
  const [cancelingOrder, setCancelingOrder] = useState<number | null>(null);
  const [editingTPSL, setEditingTPSL] = useState<any | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [showTradesOnChart, setShowTradesOnChart] = useState(false);

  // Chart ref for markers and price lines
  const chartRef = useRef<LightweightChartBridgeRef>(null);

  // Price color animation
  const previousPrice = useRef<number | null>(null);
  const priceDirection = useRef<'up' | 'down' | null>(null);
  const colorAnimation = useRef(new Animated.Value(0)).current;

  // Defer rendering until navigation is complete
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

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
    
    return generateTickSizeOptions(currentPriceForTick, 2, true);
  }, [marketType, perpMarket, selectedCoin, currentPriceForTick]);

  // Reset tick size when coin changes
  useEffect(() => {
    setTickSize(null);
  }, [selectedCoin]);

  // Load starred state when coin or market type changes
  useEffect(() => {
    if (!selectedCoin || !marketType) return;
    
    const loadStarredState = async () => {
      const starred = await isTickerStarred(selectedCoin, marketType);
      setIsStarred(starred);
    };
    
    loadStarredState();
  }, [selectedCoin, marketType]);

  // Load saved interval on mount
  useEffect(() => {
    const loadSavedInterval = async () => {
      try {
        const savedInterval = await AsyncStorage.getItem('chartInterval');
        if (savedInterval && INTERVALS.includes(savedInterval as CandleInterval)) {
          setInterval(savedInterval as CandleInterval);
        } else {
          setInterval('1d');
        }
      } catch (error) {
        console.error('[ChartScreen] Failed to load saved interval:', error);
        setInterval('1d');
      } finally {
        setIntervalLoaded(true);
      }
    };
    
    loadSavedInterval();
  }, []);

  // Load show trades preference on mount
  useEffect(() => {
    const loadShowTradesPreference = async () => {
      try {
        const value = await AsyncStorage.getItem(SHOW_TRADES_KEY);
        if (value !== null) {
          setShowTradesOnChart(value === 'true');
        }
      } catch (error) {
        console.error('[ChartScreen] Failed to load show trades preference:', error);
      }
    };
    
    loadShowTradesPreference();
  }, []);

  // Set default tick size to minimum when options change
  useEffect(() => {
    if (tickSizeOptions.length > 0 && tickSize === null) {
      const minTick = tickSizeOptions[0].value;
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
    if (!selectedCoin || !intervalLoaded || !interval) return;

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

        // Validate the new candle before adding
        if (!newCandle.timestamp || newCandle.timestamp <= 0) {
          return prev;
        }
        if (newCandle.timestamp < 1577836800000) {
          return prev;
        }
        if (!newCandle.open || !newCandle.high || !newCandle.low || !newCandle.close) {
          return prev;
        }
        if (newCandle.open <= 0 || newCandle.high <= 0 || newCandle.low <= 0 || newCandle.close <= 0) {
          return prev;
        }

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
    intervalLoaded,
    subscribeToCandles,
    unsubscribeFromCandles,
    subscribeToOrderbook,
    unsubscribeFromOrderbook,
    subscribeToTrades,
    unsubscribeFromTrades,
    fetchHistoricalCandles,
    mantissa,
    nSigFigs,
  ]);

  const handleIntervalChange = (newInterval: CandleInterval): void => {
    setInterval(newInterval);
    
    AsyncStorage.setItem('chartInterval', newInterval).catch((error) => {
      console.error('[ChartScreen] Failed to save interval:', error);
    });
  };

  // Handle star toggle
  const handleToggleStar = () => {
    if (!selectedCoin || !marketType) return;
    
    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    
    toggleStarredTicker(selectedCoin, marketType).catch((error) => {
      console.error('[ChartScreen] Failed to toggle star:', error);
      setIsStarred(!newStarredState);
    });
  };

  if (!selectedCoin) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#949e9c', marginBottom: 8 }}>No coin selected</Text>
          <Text style={{ fontSize: 12, color: '#949e9c', textAlign: 'center' }}>
            Select a coin from the Search tab
          </Text>
        </View>
      </View>
    );
  }

  // Filter and deduplicate candles before sending to chart
  const validCandles = candles
    .filter((c) => {
      if (!c.timestamp || c.timestamp <= 0) return false;
      if (c.timestamp < 1577836800000) return false;
      if (!c.open || !c.high || !c.low || !c.close) return false;
      if (c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0) return false;
      return true;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  // Deduplicate by timestamp
  const dedupedCandles: ChartData[] = [];
  const seenTimes = new Set<number>();
  
  for (let i = validCandles.length - 1; i >= 0; i--) {
    const timeKey = Math.floor(validCandles[i].timestamp / 1000);
    if (!seenTimes.has(timeKey)) {
      seenTimes.add(timeKey);
      dedupedCandles.unshift(validCandles[i]);
    }
  }

  const lwcCandles: LWCandle[] = dedupedCandles.map((c) => ({
    time: Math.floor(c.timestamp / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  // Asset info and position/balance
  const perpPosition = account.data?.perpPositions?.find?.((p: any) => p.coin === selectedCoin);
  const spotBalances = account.data?.spotBalances || [];
  const userFills = (account.data?.userFills || []).filter((f: any) => f.coin === selectedCoin);

  // Get real-time price from WebSocket
  const currentPrice = (selectedCoin && state.prices[selectedCoin]) || assetCtx?.markPx;

  // Animate price color on change
  useEffect(() => {
    if (currentPrice != null) {
      const currentPriceNum = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
      
      if (previousPrice.current !== null && previousPrice.current !== currentPriceNum) {
        if (currentPriceNum > previousPrice.current) {
          priceDirection.current = 'up';
        } else if (currentPriceNum < previousPrice.current) {
          priceDirection.current = 'down';
        }

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

  // Calculate 24h change
  const change24h = useMemo(() => {
    if (!assetCtx?.prevDayPx || !currentPrice) return null;
    const current = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    const prev = typeof assetCtx.prevDayPx === 'string' ? parseFloat(assetCtx.prevDayPx) : assetCtx.prevDayPx;
    return ((current - prev) / prev) * 100;
  }, [assetCtx?.prevDayPx, currentPrice]);

  // Get leverage for perps
  const maxLeverage = perpMarket?.maxLeverage;

  // Calculate true open interest in USD
  const openInterestUSD = useMemo(() => {
    if (!assetCtx?.openInterest || !currentPrice) return null;
    const oi = typeof assetCtx.openInterest === 'string' ? parseFloat(assetCtx.openInterest) : assetCtx.openInterest;
    const price = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    return oi * price;
  }, [assetCtx?.openInterest, currentPrice]);

  // Calculate market cap in USD for spot tickers
  const marketCapUSD = useMemo(() => {
    if (marketType !== 'spot' || !assetCtx?.circulatingSupply || !currentPrice) return null;
    const supply = typeof assetCtx.circulatingSupply === 'string' 
      ? parseFloat(assetCtx.circulatingSupply) 
      : assetCtx.circulatingSupply;
    const price = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    return supply * price;
  }, [assetCtx?.circulatingSupply, currentPrice, marketType]);

  // Interpolate price color
  const animatedPriceColor = colorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: priceDirection.current === 'up' 
      ? [Color.BRIGHT_ACCENT, Color.FG_1]
      : priceDirection.current === 'down'
      ? [Color.RED, Color.FG_1]
      : [Color.FG_1, Color.FG_1],
  });

  // Update chart markers and price lines
  useEffect(() => {
    if (!chartRef.current || !selectedCoin || candles.length === 0) return;

    const markers: ChartMarker[] = [];
    if (showTradesOnChart && userFills && userFills.length > 0) {
      const minTime = Math.min(...candles.map(c => c.timestamp));
      const maxTime = Math.max(...candles.map(c => c.timestamp));

      const visibleFills = userFills.filter((fill: any) => {
        const fillTime = fill.time;
        return fillTime >= minTime && fillTime <= maxTime;
      });

      visibleFills.forEach((fill: any) => {
        const isBuy = fill.side === 'B' || fill.side === 'buy';
        markers.push({
          time: Math.floor(fill.time / 1000),
          position: isBuy ? 'belowBar' : 'aboveBar',
          color: isBuy ? '#26a69a' : '#ef5350',
          shape: 'circle',
          text: '',
          size: 1,
        });
      });
    }

    const priceLines: ChartPriceLine[] = [];

    // Add liquidation price line for perp positions
    if (marketType === 'perp' && perpPosition && perpPosition.liquidationPx) {
      const liqPrice = typeof perpPosition.liquidationPx === 'string' 
        ? parseFloat(perpPosition.liquidationPx) 
        : perpPosition.liquidationPx;
      
      if (!isNaN(liqPrice) && liqPrice > 0) {
        priceLines.push({
          price: liqPrice,
          color: Color.RED,
          lineWidth: 1,
          lineStyle: 'dashed',
          title: `Liq`,
        });
      }
    }

    // Add entry price line for perp positions
    if (marketType === 'perp' && perpPosition && perpPosition.entryPx) {
      const entryPrice = typeof perpPosition.entryPx === 'string' 
        ? parseFloat(perpPosition.entryPx) 
        : perpPosition.entryPx;
      
      if (!isNaN(entryPrice) && entryPrice > 0) {
        priceLines.push({
          price: entryPrice,
          color: Color.FG_1,
          lineWidth: 1,
          lineStyle: 'dashed',
          title: `Entry`,
        });
      }
    }

    // Add limit order lines for current ticker
    const openOrders = account.data?.openOrders || [];
    const currentTickerOrders = openOrders.filter((order: any) => {
      if (order.coin === selectedCoin) return true;
      const spotMarket = state.spotMarkets.find(m => m.name === selectedCoin);
      if (spotMarket && order.coin === spotMarket.apiName) return true;
      return false;
    });

    currentTickerOrders.forEach((order: any) => {
      const limitPrice = typeof order.limitPx === 'string' 
        ? parseFloat(order.limitPx) 
        : order.limitPx;

      if (isNaN(limitPrice)) return;

      const orderType = order.orderType?.toLowerCase() || '';
      const isTpOrder = orderType.includes('tp') || orderType.includes('take');
      const isSlOrder = orderType.includes('sl') || orderType.includes('stop');

      let color: string;
      let title: string;

      if (isTpOrder) {
        color = Color.BRIGHT_ACCENT;
        title = `TP`;
      } else if (isSlOrder) {
        color = Color.RED;
        title = `SL`;
      } else {
        color = '#FFA500';
        title = `Limit`;
      }

      priceLines.push({
        price: limitPrice,
        color,
        lineWidth: 1,
        lineStyle: 'dashed',
        title,
      });
    });

    // Add TP/SL lines from position if they exist
    if (marketType === 'perp' && perpPosition) {
      if (perpPosition.tpPrice && perpPosition.tpPrice > 0) {
        const alreadyHasTp = priceLines.some(line => 
          Math.abs(line.price - perpPosition.tpPrice!) < 0.01 && line.title.startsWith('TP')
        );
        if (!alreadyHasTp) {
          priceLines.push({
            price: perpPosition.tpPrice,
            color: Color.BRIGHT_ACCENT,
            lineWidth: 1,
            lineStyle: 'dashed',
            title: `TP`,
          });
        }
      }
      if (perpPosition.slPrice && perpPosition.slPrice > 0) {
        const alreadyHasSl = priceLines.some(line => 
          Math.abs(line.price - perpPosition.slPrice!) < 0.01 && line.title.startsWith('SL')
        );
        if (!alreadyHasSl) {
          priceLines.push({
            price: perpPosition.slPrice,
            color: Color.RED,
            lineWidth: 1,
            lineStyle: 'dashed',
            title: `SL`,
          });
        }
      }
    }

    chartRef.current.setMarkers(markers);
    chartRef.current.setPriceLines(priceLines);
  }, [
    selectedCoin,
    candles,
    userFills,
    perpPosition,
    account.data?.openOrders,
    marketType,
    state.spotMarkets,
    showTradesOnChart,
  ]);

  // Handle cancel order
  const handleCancelOrder = async (coin: string, oid: number) => {
    if (!exchangeClient || !selectedCoin) return;
    
    const perpMarket = state.perpMarkets.find(m => m.name === coin);
    const spotMarket = state.spotMarkets.find(m => m.name === coin || m.apiName === coin);
    
    let assetIndex: number;
    if (marketType === 'perp' && perpMarket) {
      assetIndex = perpMarket.index;
    } else if (marketType === 'spot' && spotMarket) {
      assetIndex = 10000 + spotMarket.index;
    } else {
      Alert.alert('Error', `Asset ${coin} not found in markets`);
      return;
    }

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

  if (!isReady) {
    return <SkeletonScreen />;
  }

  // Prepare header stats
  const headerStats = [];
  if (assetCtx?.dayNtlVlm != null) {
    headerStats.push({
      label: '24h Vol',
      value: `$${formatLargeNumber(assetCtx.dayNtlVlm)}`,
    });
  }
  if (marketType === 'spot' && marketCapUSD != null) {
    headerStats.push({
      label: 'Market Cap',
      value: `$${formatLargeNumber(marketCapUSD)}`,
    });
  }
  if (marketType === 'perp' && assetCtx?.funding != null) {
    headerStats.push({
      label: 'Funding',
      value: formatPercentage(assetCtx.funding * 100, 4),
      isPositive: assetCtx.funding >= 0,
      isNegative: assetCtx.funding < 0,
    });
  }
  if (marketType === 'perp' && openInterestUSD != null) {
    headerStats.push({
      label: 'OI',
      value: `$${formatLargeNumber(openInterestUSD)}`,
    });
  }

  // Prepare position data for PositionContainer
  const price = currentPrice ? (typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice) : 0;
  const prevDayPx = assetCtx?.prevDayPx || price;
  const priceChange = price - prevDayPx;
  const priceChangePct = prevDayPx > 0 ? priceChange / prevDayPx : 0;

  let perpPosData = null;
  if (perpPosition && price) {
    const marginUsed = perpPosition.marginUsed 
      ? parseFloat(perpPosition.marginUsed)
      : parseFloat(perpPosition.positionValue || '0') / (perpPosition.leverage?.value || 1);
    const pnl = calculateUnrealizedPnL(perpPosition, currentPrice);
    
    perpPosData = {
      perpPosition,
      perpPrice: price,
      perpMarginUsed: marginUsed,
      perpPnl: pnl,
      perpPriceChange: priceChangePct,
    };
  }

  // Prepare spot balance data
  const baseCoin = selectedCoin.split('/')[0];
  const filteredBalance = spotBalances.find((b: any) => b.coin === baseCoin && parseFloat(b.total) > 0);
  
  let spotBalData = null;
  if (filteredBalance) {
    const balance = parseFloat(filteredBalance.total);
    let coinPrice, usdValue;
    if (filteredBalance.coin === 'USDC') {
      coinPrice = 1;
      usdValue = balance;
    } else {
      const priceStr = state.prices[filteredBalance.coin];
      coinPrice = priceStr ? parseFloat(priceStr) : 0;
      usdValue = priceStr ? balance * parseFloat(priceStr) : 0;
    }
    
    const assetContext = state.assetContexts[filteredBalance.coin];
    const prevPrice = assetContext?.prevDayPx || coinPrice;
    const change = coinPrice - prevPrice;
    const changePct = prevPrice > 0 ? change / prevPrice : 0;
    
    const spotMarket = state.spotMarkets.find(m => m.name.split('/')[0] === filteredBalance.coin);
    const displayName = spotMarket ? getDisplayTicker(spotMarket.name) : filteredBalance.coin;
    
    spotBalData = {
      spotBalance: filteredBalance,
      spotPrice: coinPrice,
      spotUsdValue: usdValue,
      spotTotal: balance,
      spotPriceChange: changePct,
      spotDisplayName: displayName,
    };
  }

  // Prepare open orders for current ticker
  const openOrders = account.data?.openOrders || [];
  const getDisplayName = (coin: string) => {
    const spotMarket = state.spotMarkets.find(m => m.name === coin || m.apiName === coin);
    if (spotMarket) return spotMarket.name;
    return coin;
  };

  const currentTickerOrders = openOrders.filter((order: any) => {
    if (order.coin === selectedCoin) return true;
    const spotMarket = state.spotMarkets.find(m => m.name === selectedCoin);
    if (spotMarket && order.coin === spotMarket.apiName) return true;
    return false;
  });

  // Prepare recent trades
  const perpCoins = new Set(state.perpMarkets.map(m => m.name));
  const spotCoins = new Set(state.spotMarkets.map(m => m.name.split('/')[0]));
  
  const filteredTrades = userFills.filter(fill => {
    if (marketType === 'perp') {
      return perpCoins.has(fill.coin);
    } else {
      return spotCoins.has(fill.coin);
    }
  });

  const getDisplayCoin = (coin: string) => {
    const isSpot = spotCoins.has(coin);
    return isSpot ? getDisplayTicker(coin) : coin;
  };

  return (
    <View style={styles.container}>
      <ChartHeader
        onBackPress={() => navigation.goBack()}
        ticker={selectedCoin}
        displayTicker={marketType === 'spot' && selectedCoin ? getDisplayTicker(selectedCoin) : selectedCoin}
        marketType={marketType}
        maxLeverage={maxLeverage}
        currentPrice={currentPrice}
        animatedPriceColor={animatedPriceColor}
        change24h={change24h}
        stats={headerStats}
      />

      <View style={styles.separator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {panel === 'chart' && (
          <ChartContent
            chartRef={chartRef}
            interval={interval}
            onIntervalChange={handleIntervalChange}
            isStarred={isStarred}
            onToggleStar={handleToggleStar}
            isLoading={isLoading}
            error={error}
            candles={lwcCandles}
          />
        )}

        {panel === 'orderbook' && (
          <OrderBookContent
            orderbook={state.orderbook}
            tickSize={tickSize}
            tickSizeOptions={tickSizeOptions}
            showTickDropdown={showTickDropdown}
            onTickSizeChange={setTickSize}
            onToggleDropdown={setShowTickDropdown}
          />
        )}

        {panel === 'trades' && (
          <TradesContent trades={state.recentTrades} />
        )}

        {/* Panel Selector */}
        <PanelSelector
          options={['Chart', 'Order Book', 'Trades']}
          selectedOption={panel === 'chart' ? 'Chart' : panel === 'orderbook' ? 'Order Book' : 'Trades'}
          onOptionChange={(option) => {
            if (option === 'Chart') setPanel('chart');
            else if (option === 'Order Book') setPanel('orderbook');
            else if (option === 'Trades') setPanel('trades');
          }}
        />

        {/* Position / Balances */}
        <PositionContainer
          marketType={marketType}
          selectedCoin={selectedCoin}
          {...(marketType === 'perp' ? perpPosData : {})}
          {...(marketType === 'spot' ? spotBalData : {})}
          onEditTpSl={() => setEditingTPSL(perpPosition)}
          onMarketClose={() => setShowCloseModal(true)}
        />

        {/* Open Orders */}
        <OpenOrdersContainer
          orders={currentTickerOrders}
          getDisplayName={getDisplayName}
          onCancelOrder={handleCancelOrder}
          cancelingOrder={cancelingOrder}
        />

        {/* Recent Trades */}
        <RecentTradesContainer
          trades={filteredTrades}
          getDisplayCoin={getDisplayCoin}
        />
      </ScrollView>

      {/* Buy/Sell Buttons */}
      <BuySellButtons
        onBuyPress={() => {
          setOrderTicketDefaultSide('buy');
          setShowOrderTicket(true);
        }}
        onSellPress={() => {
          setOrderTicketDefaultSide('sell');
          setShowOrderTicket(true);
        }}
      />

      {/* Order Ticket Modal */}
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
      
      {/* Close Position Modal */}
      {perpPosition && selectedCoin && (
        <ClosePositionModal
          visible={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          position={perpPosition}
          currentPrice={typeof currentPrice === 'string' ? parseFloat(currentPrice) : (currentPrice || 0)}
          coin={selectedCoin}
        />
      )}
    </View>
  );
}



import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { CandlestickChart } from 'react-native-wagmi-charts';
import { useWebSocket } from '../contexts/WebSocketContext';
import { resolveSubscriptionCoin } from '../lib/markets';
import type { Candle, CandleInterval } from '../types';
import { styles } from './styles/ChartScreen.styles';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function ChartScreen(): React.JSX.Element {
  const { state, infoClient, subscribeToCandles, unsubscribeFromCandles } =
    useWebSocket();
  const { selectedCoin, marketType, spotMarkets } = state;

  const [candles, setCandles] = useState<ChartData[]>([]);
  const [interval, setInterval] = useState<CandleInterval>('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

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

    return () => {
      unsubscribeFromCandles();
    };
  }, [
    selectedCoin,
    interval,
    subscribeToCandles,
    unsubscribeFromCandles,
    fetchHistoricalCandles,
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{selectedCoin}</Text>
            <Text style={styles.subtitle}>
              {marketType === 'perp' ? 'Perpetual' : 'Spot'}
            </Text>
          </View>
        </View>

        <View style={styles.intervalSelector}>
          {INTERVALS.map((int) => (
            <TouchableOpacity
              key={int}
              style={[
                styles.intervalButton,
                interval === int && styles.intervalButtonActive,
              ]}
              onPress={() => handleIntervalChange(int)}
            >
              <Text
                style={[
                  styles.intervalText,
                  interval === int && styles.intervalTextActive,
                ]}
              >
                {int}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={styles.loadingText}>Loading chart data...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {!isLoading && !error && candles.length > 0 && (
          <View style={styles.chartContainer}>
            <CandlestickChart.Provider data={candles}>
              <CandlestickChart height={400}>
                <CandlestickChart.Candles />
                <CandlestickChart.Crosshair>
                  <CandlestickChart.Tooltip />
                </CandlestickChart.Crosshair>
              </CandlestickChart>
            </CandlestickChart.Provider>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                {candles.length} candles loaded
              </Text>
              <Text style={styles.infoText}>Live updates active</Text>
            </View>
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
      </ScrollView>
    </View>
  );
}


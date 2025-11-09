import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LightweightChartBridge, { LWCandle, LightweightChartBridgeRef } from '../../../chart/LightweightChartBridge';
import { LoadingBlob } from '../../../shared/components';
import { styles } from '../styles/ChartContent.styles';
import { Color } from '../../../shared/styles';
import type { CandleInterval } from '../../../../types';
import { playStarHaptic } from '../../../../lib/haptics';

const INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

interface ChartContentProps {
  chartRef: React.RefObject<LightweightChartBridgeRef | null>;
  interval: CandleInterval | null;
  onIntervalChange: (interval: CandleInterval) => void;
  isStarred: boolean;
  onToggleStar: () => void;
  isLoading: boolean;
  error: string | null;
  candles: LWCandle[];
}

export default function ChartContent({
  chartRef,
  interval,
  onIntervalChange,
  isStarred,
  onToggleStar,
  isLoading,
  error,
  candles,
}: ChartContentProps): React.JSX.Element {
  return (
    <View style={styles.chartFixedContainer}>
      <View style={styles.chartIntervalHeader}>
        {INTERVALS.map((int) => (
          <TouchableOpacity
            key={int}
            onPress={() => onIntervalChange(int)}
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
        <TouchableOpacity
          onPress={() => {
            playStarHaptic();
            onToggleStar();
          }}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={isStarred ? "star" : "star-border"} 
            size={22} 
            color={isStarred ? Color.GOLD : Color.FG_1}
          />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
            <LoadingBlob />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!isLoading && !error && candles.length > 0 && (
        <View style={styles.chartContainer}>
          <LightweightChartBridge ref={chartRef} candles={candles} smaPeriod={20} height={400} />
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
    </View>
  );
}



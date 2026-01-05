import React, { useMemo, useState, useCallback } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';
import { Color } from '../../styles';
import { styles } from './Sparkline.styles';

export interface SparklinePoint {
  timestamp: number;
  value: number;
}

export interface SparklineData {
  points: SparklinePoint[];
  isPositive: boolean;
  lastUpdated: number;
}

interface SparklineProps {
  data: SparklinePoint[] | null;
  isPositive: boolean;
  width?: number;
  height?: number;
  fillContainer?: boolean;
}

function SparklineComponent({
  data,
  isPositive,
  width: propWidth,
  height: propHeight,
  fillContainer = false,
}: SparklineProps): React.JSX.Element | null {
  const [containerSize, setContainerSize] = useState<{width: number; height: number} | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setContainerSize({ width: w, height: h });
  }, []);

  // Use container size if fillContainer, otherwise use props or defaults
  const width = fillContainer ? (containerSize?.width ?? 0) : (propWidth ?? 70);
  const height = fillContainer ? (containerSize?.height ?? 0) : (propHeight ?? 28);

  // Memoize the color to prevent re-renders
  const color = useMemo(
    () => (isPositive ? Color.BRIGHT_ACCENT : Color.RED),
    [isPositive]
  );

  // Normalize data to 0-1 range for maximum visual impact
  const normalizedData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const values = data.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // If range is essentially zero (flat line), return centered values
    if (range < Number.EPSILON) {
      return data.map(p => ({ timestamp: p.timestamp, value: 0.5 }));
    }

    // Normalize to 0-1 scale with padding (0.1 to 0.9) to avoid edge clipping
    return data.map(p => ({
      timestamp: p.timestamp,
      value: 0.1 + ((p.value - min) / range) * 0.8,
    }));
  }, [data]);

  // Fixed yRange for normalized data
  const yRange = useMemo(() => {
    if (!normalizedData || normalizedData.length < 2) return undefined;
    return { min: 0, max: 1 };
  }, [normalizedData]);

  // Container style - flex to fill if fillContainer, otherwise fixed dimensions
  const containerStyle = fillContainer
    ? [styles.container, styles.fillContainer]
    : [styles.container, { width, height }];

  // Return empty container if no data
  if (!normalizedData || normalizedData.length < 2) {
    return <View style={containerStyle} onLayout={fillContainer ? onLayout : undefined} />;
  }

  // Wait for layout measurement when filling container
  if (fillContainer && (width === 0 || height === 0)) {
    return <View style={containerStyle} onLayout={onLayout} />;
  }

  return (
    <View style={containerStyle} onLayout={fillContainer ? onLayout : undefined}>
      <LineChart.Provider data={normalizedData} yRange={yRange}>
        <LineChart width={width} height={height}>
          <LineChart.Path color={color} width={1.5} />
        </LineChart>
      </LineChart.Provider>
    </View>
  );
}

// Custom comparison function for React.memo
function arePropsEqual(
  prevProps: SparklineProps,
  nextProps: SparklineProps
): boolean {
  // Compare isPositive
  if (prevProps.isPositive !== nextProps.isPositive) return false;

  // Compare fillContainer
  if (prevProps.fillContainer !== nextProps.fillContainer) return false;

  // Compare dimensions (only relevant if not fillContainer)
  if (prevProps.width !== nextProps.width) return false;
  if (prevProps.height !== nextProps.height) return false;

  // Compare data arrays
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  // Both null/empty
  if (!prevData && !nextData) return true;
  if (!prevData || !nextData) return false;

  // Different lengths
  if (prevData.length !== nextData.length) return false;

  // Compare last data point (most common change)
  const prevLast = prevData[prevData.length - 1];
  const nextLast = nextData[nextData.length - 1];
  if (prevLast?.value !== nextLast?.value) return false;
  if (prevLast?.timestamp !== nextLast?.timestamp) return false;

  return true;
}

export default React.memo(SparklineComponent, arePropsEqual);

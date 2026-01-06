import React, { useMemo, useState, useCallback } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

// Decimate data points for performance (keep every Nth point)
// 96 points -> 70 points for smoother sparklines
const MAX_POINTS = 70;

function decimateData(data: SparklinePoint[]): SparklinePoint[] {
  if (data.length <= MAX_POINTS) return data;

  const step = (data.length - 1) / (MAX_POINTS - 1);
  const result: SparklinePoint[] = [];

  for (let i = 0; i < MAX_POINTS; i++) {
    const idx = Math.round(i * step);
    result.push(data[idx]);
  }

  return result;
}

// Generate SVG path string from data points
function generatePathString(
  data: SparklinePoint[],
  width: number,
  height: number,
  padding: number = 0.25
): string {
  const values = data.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const paddedHeight = height * (1 - 2 * padding);
  const yOffset = height * padding;
  const xStep = width / (data.length - 1);

  let pathStr = '';

  for (let i = 0; i < data.length; i++) {
    const x = i * xStep;

    let normalizedY: number;
    if (range < Number.EPSILON) {
      normalizedY = 0.5; // Flat line centered
    } else {
      normalizedY = 1 - (data[i].value - min) / range;
    }

    const y = yOffset + normalizedY * paddedHeight;

    if (i === 0) {
      pathStr = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      pathStr += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }

  return pathStr;
}

function SparklineComponent({
  data,
  isPositive,
  width: propWidth,
  height: propHeight,
  fillContainer = false,
}: SparklineProps): React.JSX.Element | null {
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setContainerSize({ width: w, height: h });
  }, []);

  const width = fillContainer ? (containerSize?.width ?? 0) : (propWidth ?? 70);
  const height = fillContainer
    ? (containerSize?.height ?? 0)
    : (propHeight ?? 28);

  // Memoize color
  const color = useMemo(
    () => (isPositive ? Color.BRIGHT_ACCENT : Color.RED),
    [isPositive]
  );

  // Generate path string with decimation
  const pathString = useMemo(() => {
    if (!data || data.length < 2 || width <= 0 || height <= 0) {
      return null;
    }

    // Decimate data for performance
    const decimated = decimateData(data);
    return generatePathString(decimated, width, height);
  }, [data, width, height]);

  const containerStyle = fillContainer
    ? [styles.container, styles.fillContainer]
    : [styles.container, { width, height }];

  // Return empty container if no data
  if (!data || data.length < 2) {
    return (
      <View
        style={containerStyle}
        onLayout={fillContainer ? onLayout : undefined}
      />
    );
  }

  // Wait for layout measurement when filling container
  if (fillContainer && (width === 0 || height === 0)) {
    return <View style={containerStyle} onLayout={onLayout} />;
  }

  // Don't render if path couldn't be created
  if (!pathString) {
    return (
      <View
        style={containerStyle}
        onLayout={fillContainer ? onLayout : undefined}
      />
    );
  }

  return (
    <View style={containerStyle} onLayout={fillContainer ? onLayout : undefined}>
      <Svg width={width} height={height}>
        <Path
          d={pathString}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Custom comparison function for React.memo
// Optimized for live price updates - uses value threshold instead of exact match
function arePropsEqual(
  prevProps: SparklineProps,
  nextProps: SparklineProps
): boolean {
  if (prevProps.isPositive !== nextProps.isPositive) return false;
  if (prevProps.fillContainer !== nextProps.fillContainer) return false;
  if (prevProps.width !== nextProps.width) return false;
  if (prevProps.height !== nextProps.height) return false;

  const prevData = prevProps.data;
  const nextData = nextProps.data;

  if (!prevData && !nextData) return true;
  if (!prevData || !nextData) return false;

  // Allow 1 point difference for live point appending
  const lengthDiff = Math.abs(prevData.length - nextData.length);
  if (lengthDiff > 1) return false;

  // Compare last data point using value threshold
  // This prevents excessive re-renders on tiny price fluctuations
  const prevLast = prevData[prevData.length - 1];
  const nextLast = nextData[nextData.length - 1];

  if (!prevLast || !nextLast) return false;

  // Use 0.1% threshold for value comparison
  const VALUE_THRESHOLD = 0.001;
  const prevValue = prevLast.value;
  const nextValue = nextLast.value;

  if (prevValue === 0 && nextValue === 0) return true;
  if (prevValue === 0 || nextValue === 0) return false;

  const valueDiff = Math.abs(nextValue - prevValue) / Math.abs(prevValue);
  if (valueDiff > VALUE_THRESHOLD) return false;

  return true;
}

export default React.memo(SparklineComponent, arePropsEqual);

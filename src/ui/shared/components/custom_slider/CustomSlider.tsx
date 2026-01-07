import React, { useCallback, useRef } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { styles, THUMB_SIZE, DOT_SIZE } from './styles/CustomSlider.styles';

interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  showDots?: boolean;
  dotPositions?: number[];
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
}

// Throttle interval for JS callbacks (ms) - visual updates remain smooth
const THROTTLE_MS = 50;

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  showDots = true,
  dotPositions = [0, 25, 50, 75, 100],
  onSlidingStart,
  onSlidingComplete,
}) => {
  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const lastUpdateTime = useSharedValue(0);

  // Store latest callbacks in refs to avoid stale closures
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingStartRef = useRef(onSlidingStart);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  onValueChangeRef.current = onValueChange;
  onSlidingStartRef.current = onSlidingStart;
  onSlidingCompleteRef.current = onSlidingComplete;

  // Convert value to position
  const valueToPosition = useCallback((val: number, tw: number) => {
    const range = maximumValue - minimumValue;
    if (range === 0) return 0;
    const percentage = (val - minimumValue) / range;
    return percentage * tw;
  }, [minimumValue, maximumValue]);

  // Convert position to value
  const positionToValue = useCallback((pos: number, tw: number) => {
    if (tw === 0) return minimumValue;
    const range = maximumValue - minimumValue;
    const percentage = Math.max(0, Math.min(1, pos / tw));
    let val = minimumValue + percentage * range;

    // Apply step
    if (step > 0) {
      val = Math.round(val / step) * step;
    }

    return Math.max(minimumValue, Math.min(maximumValue, val));
  }, [minimumValue, maximumValue, step]);

  // JS callbacks for gesture handler
  const updateValue = useCallback((pos: number, tw: number) => {
    const newValue = positionToValue(pos, tw);
    onValueChangeRef.current(newValue);
  }, [positionToValue]);

  const handleComplete = useCallback((pos: number, tw: number) => {
    const finalValue = positionToValue(pos, tw);
    if (onSlidingCompleteRef.current) {
      onSlidingCompleteRef.current(finalValue);
    }
  }, [positionToValue]);

  const callSlidingStart = useCallback(() => {
    if (onSlidingStartRef.current) {
      onSlidingStartRef.current();
    }
  }, []);

  // Pan gesture with directional detection and throttled JS callbacks
  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])   // Only activate after 5px horizontal movement
    .failOffsetY([-10, 10])   // Fail (allow scroll) if vertical movement exceeds 10px first
    .onStart((event) => {
      'worklet';
      const x = event.x;
      const tw = trackWidth.value;
      const newPosition = Math.max(0, Math.min(tw, x));
      translateX.value = newPosition;
      lastUpdateTime.value = Date.now();
      runOnJS(callSlidingStart)();
      runOnJS(updateValue)(newPosition, tw);
    })
    .onUpdate((event) => {
      'worklet';
      const x = event.x;
      const tw = trackWidth.value;
      const newPosition = Math.max(0, Math.min(tw, x));
      // Always update visual position (stays on UI thread - smooth)
      translateX.value = newPosition;
      // Throttle JS callbacks to reduce re-renders
      const now = Date.now();
      if (now - lastUpdateTime.value >= THROTTLE_MS) {
        lastUpdateTime.value = now;
        runOnJS(updateValue)(newPosition, tw);
      }
    })
    .onEnd(() => {
      'worklet';
      // Always fire final update to ensure state is accurate
      runOnJS(updateValue)(translateX.value, trackWidth.value);
      runOnJS(handleComplete)(translateX.value, trackWidth.value);
    });

  // Handle layout to get track width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    trackWidth.value = width;
    // Set initial position
    translateX.value = valueToPosition(value, width);
  }, [valueToPosition, value, translateX, trackWidth]);

  // Sync external value changes
  React.useEffect(() => {
    const tw = trackWidth.value;
    if (tw > 0) {
      translateX.value = valueToPosition(value, tw);
    }
  }, [value, valueToPosition, translateX, trackWidth]);

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));

  const filledTrackStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  // Calculate current percentage for dot coloring
  const currentPercentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={styles.sliderArea}
          onLayout={handleLayout}
        >
          {/* Track background */}
          <View style={styles.track}>
            {/* Filled portion */}
            <Animated.View style={[styles.trackFilled, filledTrackStyle]} />
          </View>

          {/* Dot markers */}
          {showDots && (
            <View style={styles.dotsContainer} pointerEvents="none">
              {dotPositions.map((dotPercent) => {
                const isFilled = dotPercent <= currentPercentage;
                return (
                  <View
                    key={dotPercent}
                    style={[
                      styles.dot,
                      { left: `${dotPercent}%`, marginLeft: -DOT_SIZE / 2 },
                      isFilled ? styles.dotFilled : styles.dotEmpty,
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none">
            <View style={styles.thumbInner} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

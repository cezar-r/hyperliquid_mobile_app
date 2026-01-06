import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface MarqueeViewProps {
  children: React.ReactNode;
  speed?: number; // Pixels per second (default: 30)
  pauseDuration?: number; // Pause at start in ms (default: 1000)
}

function MarqueeView({
  children,
  speed = 30,
  pauseDuration = 1000,
}: MarqueeViewProps): React.JSX.Element {
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContentWidth(width);
  };

  useEffect(() => {
    // Cancel any existing animation
    cancelAnimation(translateX);

    if (containerWidth > 0 && contentWidth > containerWidth) {
      // Content overflows, start scrolling animation
      const scrollDistance = contentWidth - containerWidth + 8; // +8 for end padding
      const duration = (scrollDistance / speed) * 1000;

      translateX.value = withRepeat(
        withSequence(
          // Pause at start position
          withDelay(
            pauseDuration,
            // Scroll to the left
            withTiming(-scrollDistance, {
              duration,
              easing: Easing.linear,
            })
          ),
          // Pause at end position, then smooth snapback
          withDelay(
            pauseDuration,
            withTiming(0, {
              duration: 400,
              easing: Easing.out(Easing.cubic),
            })
          )
        ),
        -1 // Infinite repeat
      );
    } else {
      // No overflow, reset position
      translateX.value = 0;
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [contentWidth, containerWidth, speed, pauseDuration, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.measurable} onLayout={handleContentLayout}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurable: {
    flexDirection: 'row',
    flexShrink: 0, // Prevent shrinking so we can measure true width
  },
});

export default React.memo(MarqueeView);

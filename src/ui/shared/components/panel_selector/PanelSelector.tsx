import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { playToggleHaptic } from '../../../../lib/haptics';
import { styles } from './styles/PanelSelector.styles';
import { spacing } from '../../styles';

interface PanelSelectorProps {
  options: string[];
  selectedOption: string;
  onOptionChange: (option: string) => void;
}

export default function PanelSelector({
  options,
  selectedOption,
  onOptionChange,
}: PanelSelectorProps): React.JSX.Element {
  // Calculate initial position based on selectedOption to avoid animation on mount
  const initialPosition = useMemo(() => {
    const index = options.indexOf(selectedOption);
    const screenWidth = Dimensions.get('window').width;
    const paddingHorizontal = spacing.md;
    const availableWidth = screenWidth - paddingHorizontal * 2;
    const segmentWidth = availableWidth / options.length;
    return index * segmentWidth;
  }, []); // Empty deps - only calculate once on mount

  const filterLinePosition = useRef(new Animated.Value(initialPosition)).current;
  const isFirstRender = useRef(true);

  // Animate filter line position when selected option changes
  useEffect(() => {
    const index = options.indexOf(selectedOption);
    const screenWidth = Dimensions.get('window').width;
    const paddingHorizontal = spacing.md;
    const availableWidth = screenWidth - paddingHorizontal * 2;
    const segmentWidth = availableWidth / options.length;

    // Skip animation on first render since we initialized to correct position
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    Animated.timing(filterLinePosition, {
      toValue: index * segmentWidth,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [selectedOption, options, filterLinePosition]);

  const handleOptionPress = (option: string) => {
    playToggleHaptic();
    onOptionChange(option);
  };

  return (
    <View style={styles.filterContainer}>
      <View style={styles.panelSelector}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.panelButton}
            onPress={() => handleOptionPress(option)}
          >
            <Text
              style={[
                styles.panelText,
                selectedOption === option && styles.panelTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.separatorContainer}>
        <Animated.View
          style={[
            styles.slidingSeparator,
            {
              width: `${(100 / options.length).toFixed(2)}%` as any,
              transform: [{ translateX: filterLinePosition }],
            },
          ]}
        />
      </View>
    </View>
  );
}


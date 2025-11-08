import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { playToggleHaptic } from '../../../lib/haptics';
import { styles } from './styles/PanelSelector.styles';
import { spacing } from '../../../theme/spacing';

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
  const filterLinePosition = useRef(new Animated.Value(0)).current;

  // Animate filter line position when selected option changes
  useEffect(() => {
    const index = options.indexOf(selectedOption);
    const screenWidth = Dimensions.get('window').width;
    const paddingHorizontal = spacing.md;
    const availableWidth = screenWidth - paddingHorizontal * 2;
    const segmentWidth = availableWidth / options.length;
    const separatorWidth = segmentWidth;

    Animated.timing(filterLinePosition, {
      toValue: index * segmentWidth,
      duration: options.length * 50,
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


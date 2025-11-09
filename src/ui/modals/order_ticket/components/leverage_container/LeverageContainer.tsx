import React from 'react';
import { View, Text } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import { styles } from './styles/LeverageContainer.styles';
import Color from '../../../../shared/styles/colors';

interface LeverageContainerProps {
  leverage: number;
  onLeverageChange: (value: number) => void;
  maxLeverage: number;
  onSliderChange?: () => void;
}

export const LeverageContainer: React.FC<LeverageContainerProps> = ({
  leverage,
  onLeverageChange,
  maxLeverage,
  onSliderChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Leverage: {leverage}x</Text>
        <Text style={styles.badge}>Max: {maxLeverage}x</Text>
      </View>
      <SliderComponent
        style={styles.slider}
        minimumValue={1}
        maximumValue={maxLeverage}
        step={1}
        value={Math.min(leverage, maxLeverage)}
        onValueChange={(value) => {
          if (onSliderChange) onSliderChange();
          onLeverageChange(value);
        }}
        minimumTrackTintColor={Color.BRIGHT_ACCENT}
        maximumTrackTintColor={Color.BG_3}
        thumbTintColor={Color.BRIGHT_ACCENT}
      />
    </View>
  );
};


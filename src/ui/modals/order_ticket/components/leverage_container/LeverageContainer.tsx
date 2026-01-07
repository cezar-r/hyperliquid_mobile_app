import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { CustomSlider } from '../../../../shared/components/custom_slider';
import { styles } from './styles/LeverageContainer.styles';

interface LeverageContainerProps {
  leverage: number;
  onLeverageChange: (value: number) => void;
  maxLeverage: number;
  onSliderChange?: () => void;
  onSliderStart?: () => void;
  onSliderComplete?: () => void;
}

export const LeverageContainer: React.FC<LeverageContainerProps> = memo(({
  leverage,
  onLeverageChange,
  maxLeverage,
  onSliderChange,
  onSliderStart,
  onSliderComplete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Leverage: {leverage}x</Text>
        <Text style={styles.badge}>Max: {maxLeverage}x</Text>
      </View>
      <CustomSlider
        value={Math.min(leverage, maxLeverage)}
        onValueChange={(value) => {
          if (onSliderChange) onSliderChange();
          onLeverageChange(value);
        }}
        onSlidingStart={onSliderStart}
        onSlidingComplete={onSliderComplete}
        minimumValue={1}
        maximumValue={maxLeverage}
        step={1}
        showDots={false}
      />
    </View>
  );
});


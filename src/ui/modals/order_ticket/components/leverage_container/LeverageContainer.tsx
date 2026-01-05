import React from 'react';
import { View, Text } from 'react-native';
import { CustomSlider } from '../../../../shared/components/custom_slider';
import { styles } from './styles/LeverageContainer.styles';

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
      <CustomSlider
        value={Math.min(leverage, maxLeverage)}
        onValueChange={(value) => {
          if (onSliderChange) onSliderChange();
          onLeverageChange(value);
        }}
        minimumValue={1}
        maximumValue={maxLeverage}
        step={1}
        showDots={false}
      />
    </View>
  );
};


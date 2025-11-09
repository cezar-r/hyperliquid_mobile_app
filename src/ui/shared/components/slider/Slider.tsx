import React from 'react';
import { View } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import { styles } from './styles/Slider.styles';
import { Color } from '../../styles/colors';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({ 
  value, 
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
}) => {
  return (
    <View style={styles.sliderContainer}>
      <SliderComponent
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={Color.BRIGHT_ACCENT}
        maximumTrackTintColor={Color.BG_3}
        thumbTintColor={Color.BRIGHT_ACCENT}
      />
    </View>
  );
};


import React from 'react';
import { View, Text, TextInput } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import { styles } from './styles/MarginContainer.styles';
import Color from '../../../../shared/styles/colors';
import { formatWithCommas } from '../../../../../lib/formatting';

interface MarginContainerProps {
  marginRequired: number;
  onMarginChange: (value: string) => void;
  tradeableBalance: number;
  sizePercent: number;
  onSizePercentChange: (percent: number) => void;
  onSliderChange?: () => void;
}

export const MarginContainer: React.FC<MarginContainerProps> = ({
  marginRequired,
  onMarginChange,
  tradeableBalance,
  sizePercent,
  onSizePercentChange,
  onSliderChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Margin Required (USD)</Text>
        <Text style={styles.badge}>Tradeable: ${formatWithCommas(tradeableBalance, 2)}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={marginRequired ? marginRequired.toString() : ''}
        onChangeText={onMarginChange}
        placeholder="0.00"
        placeholderTextColor={Color.FG_3}
        keyboardType="decimal-pad"
        keyboardAppearance="dark"
      />
      <SliderComponent
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={sizePercent}
        onValueChange={(value) => {
          if (onSliderChange) onSliderChange();
          onSizePercentChange(value);
        }}
        minimumTrackTintColor={Color.BRIGHT_ACCENT}
        maximumTrackTintColor={Color.BG_3}
        thumbTintColor={Color.BRIGHT_ACCENT}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>0%</Text>
        <Text style={styles.sliderLabelText}>25%</Text>
        <Text style={styles.sliderLabelText}>50%</Text>
        <Text style={styles.sliderLabelText}>75%</Text>
        <Text style={styles.sliderLabelText}>100%</Text>
      </View>
    </View>
  );
};


import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { CustomSlider } from '../../../../shared/components/custom_slider';
import { styles } from './styles/SizeContainer.styles';
import Color from '../../../../shared/styles/colors';
import { formatWithCommas } from '../../../../../lib/formatting';

interface SizeContainerProps {
  coin: string;
  size: string;
  onSizeChange: (value: string) => void;
  sizePercent: number;
  onSizePercentChange: (percent: number) => void;
  tradeableBalance: number;
  tradeableLabel: string;
  side: 'buy' | 'sell';
  onSliderChange?: () => void;
}

export const SizeContainer: React.FC<SizeContainerProps> = ({
  coin,
  size,
  onSizeChange,
  sizePercent,
  onSizePercentChange,
  tradeableBalance,
  tradeableLabel,
  side,
  onSliderChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Size ({coin.split('/')[0]})</Text>
        <Text style={styles.badge}>
          Tradeable: {tradeableLabel}
        </Text>
      </View>
      <TextInput
        style={styles.input}
        value={size}
        onChangeText={onSizeChange}
        placeholder="0.0000"
        placeholderTextColor={Color.FG_3}
        keyboardType="decimal-pad"
        keyboardAppearance="dark"
      />
      <CustomSlider
        value={sizePercent}
        onValueChange={(value) => {
          if (onSliderChange) onSliderChange();
          onSizePercentChange(value);
        }}
        minimumValue={0}
        maximumValue={100}
        step={5}
        showDots={true}
        dotPositions={[0, 25, 50, 75, 100]}
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


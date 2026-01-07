import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { CustomSlider } from '../../../../shared/components/custom_slider';
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
  collateral?: string; // Collateral token symbol (e.g., 'USDC', 'USDH')
}

export const MarginContainer: React.FC<MarginContainerProps> = ({
  marginRequired,
  onMarginChange,
  tradeableBalance,
  sizePercent,
  onSizePercentChange,
  onSliderChange,
  collateral = 'USDC',
}) => {
  // Local state to preserve raw input (including trailing decimal/zeros)
  const [inputValue, setInputValue] = useState('');

  // Sync with external marginRequired when it changes (e.g., from slider)
  useEffect(() => {
    const currentNumeric = parseFloat(inputValue) || 0;
    // Only update if the numeric value differs (avoids overwriting user's raw input)
    if (currentNumeric !== marginRequired) {
      setInputValue(marginRequired ? marginRequired.toString() : '');
    }
  }, [marginRequired]);

  const handleTextChange = (text: string) => {
    // Allow empty, digits, and single decimal point
    if (text === '' || /^\d*\.?\d*$/.test(text)) {
      setInputValue(text);
      onMarginChange(text);
    }
  };

  // Use $ for USDC, otherwise show collateral symbol
  const collateralDisplay = collateral === 'USDC' ? '$' : `${collateral} `;
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Margin Required (USD)</Text>
        <Text style={styles.badge}>Tradeable: {collateralDisplay}{formatWithCommas(tradeableBalance, 2)}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={handleTextChange}
        placeholder="0.00"
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


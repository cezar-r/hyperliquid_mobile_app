import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './styles/TpSlContainer.styles';
import Color from '../../../../shared/styles/colors';

interface TpSlContainerProps {
  expanded: boolean;
  onToggleExpand: () => void;
  takeProfitPrice: string;
  onTakeProfitChange: (value: string) => void;
  stopLossPrice: string;
  onStopLossChange: (value: string) => void;
  tpPercent: number;
  slPercent: number;
  tpValid: boolean;
  slValid: boolean;
  side: 'buy' | 'sell';
}

export const TpSlContainer: React.FC<TpSlContainerProps> = ({
  expanded,
  onToggleExpand,
  takeProfitPrice,
  onTakeProfitChange,
  stopLossPrice,
  onStopLossChange,
  tpPercent,
  slPercent,
  tpValid,
  slValid,
  side,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Take Profit / Stop Loss</Text>
        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
          ›
        </Text>
      </TouchableOpacity>
      
      {expanded && (
        <>
          <View style={[styles.inputGroup, { marginTop: 15 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Take Profit Price</Text>
              {tpPercent !== 0 && (
                <Text style={[
                  styles.percentText,
                  tpPercent > 0 ? styles.percentGain : styles.percentLoss
                ]}>
                  {tpPercent > 0 ? '+' : ''}{tpPercent.toFixed(2)}%
                </Text>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                takeProfitPrice && !tpValid && styles.inputInvalid
              ]}
              value={takeProfitPrice}
              onChangeText={onTakeProfitChange}
              placeholder="Optional"
              placeholderTextColor={Color.FG_3}
              keyboardType="decimal-pad"
            />
            {takeProfitPrice && !tpValid && (
              <Text style={styles.validationError}>
                {side === 'buy' ? 'Must be > entry price' : 'Must be < entry price'}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Stop Loss Price</Text>
              {slPercent !== 0 && (
                <Text style={[
                  styles.percentText,
                  slPercent > 0 ? styles.percentGain : styles.percentLoss
                ]}>
                  {slPercent > 0 ? '+' : ''}{slPercent.toFixed(2)}%
                </Text>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                stopLossPrice && !slValid && styles.inputInvalid
              ]}
              value={stopLossPrice}
              onChangeText={onStopLossChange}
              placeholder="Optional"
              placeholderTextColor={Color.FG_3}
              keyboardType="decimal-pad"
            />
            {stopLossPrice && !slValid && (
              <Text style={styles.validationError}>
                {side === 'buy' ? 'Must be < entry price' : 'Must be > entry price'}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};


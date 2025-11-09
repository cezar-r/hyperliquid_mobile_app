import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles/TPSLInputField.styles';
import { Color } from '../../../../shared/styles/colors';

interface TPSLInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  percentChange: number;
  inputRef?: React.RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
}

export const TPSLInputField: React.FC<TPSLInputFieldProps> = ({
  label,
  value,
  onChangeText,
  percentChange,
  inputRef,
  onSubmitEditing,
  returnKeyType = 'next',
}) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.percentBadgeContainer}>
          {percentChange !== 0 && (
            <View style={[styles.percentBadge, { backgroundColor: percentChange > 0 ? Color.BRIGHT_ACCENT + '20' : Color.RED + '20' }]}>
              <Text style={[styles.percentText, { color: percentChange > 0 ? Color.BRIGHT_ACCENT : Color.RED }]}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Optional"
        placeholderTextColor={Color.FG_3}
        keyboardType="decimal-pad"
        keyboardAppearance="dark"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
};


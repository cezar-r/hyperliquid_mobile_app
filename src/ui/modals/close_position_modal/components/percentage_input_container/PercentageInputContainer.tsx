import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles/PercentageInputContainer.styles';

interface PercentageInputContainerProps {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  autoFocus?: boolean;
}

export const PercentageInputContainer: React.FC<PercentageInputContainerProps> = ({ 
  value, 
  onChangeText,
  inputRef,
  autoFocus = false,
}) => {
  return (
    <View style={styles.percentageInputContainer}>
      <TextInput
        ref={inputRef}
        style={styles.percentageInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="#6B7280"
        keyboardType="decimal-pad"
        keyboardAppearance="dark"
        autoFocus={autoFocus}
      />
      <Text style={styles.percentageSymbol}>%</Text>
    </View>
  );
};


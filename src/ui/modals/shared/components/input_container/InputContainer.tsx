import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Color } from '../../../../shared/styles/colors';
import { styles } from './styles/InputContainer.styles';
import { playPrimaryButtonHaptic } from '../../../../../lib/haptics';

interface InputContainerProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onMaxPress?: () => void;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric';
}

export const InputContainer: React.FC<InputContainerProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '0.00',
  onMaxPress,
  autoFocus = false,
  keyboardType = 'decimal-pad',
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWithButton}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Color.FG_3}
          keyboardType={keyboardType}
          keyboardAppearance="dark"
          autoFocus={autoFocus}
        />
        {onMaxPress && (
          <TouchableOpacity style={styles.maxButton} onPress={() => {
            playPrimaryButtonHaptic();
            onMaxPress();
          }}>
            <Text style={styles.maxButtonText}>Max</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


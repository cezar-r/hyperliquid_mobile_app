import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Color, fontSizes, spacing } from '../../../shared/styles';

interface VolumeThresholdRowProps {
  value: number;
  onSave: (value: number) => void;
}

function formatThreshold(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value}`;
}

export default function VolumeThresholdRow({
  value,
  onSave,
}: VolumeThresholdRowProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handlePress = () => {
    setInputValue(value.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
      }}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isEditing}
    >
      <Text
        style={{
          fontSize: fontSizes.md,
          color: Color.FG_1,
          flex: 1,
        }}
      >
        Min. 24h Volume (Search)
      </Text>
      {isEditing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: Color.FG_3, fontSize: fontSizes.md }}>$</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: Color.BRIGHT_ACCENT,
              borderRadius: 4,
              paddingVertical: 4,
              paddingHorizontal: 8,
              width: 80,
              color: Color.FG_1,
              fontSize: fontSizes.md,
              textAlign: 'right',
            }}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            onBlur={handleBlur}
            onSubmitEditing={handleSave}
            returnKeyType="done"
          />
        </View>
      ) : (
        <Text style={{ color: Color.FG_3, fontSize: fontSizes.md }}>
          {formatThreshold(value)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

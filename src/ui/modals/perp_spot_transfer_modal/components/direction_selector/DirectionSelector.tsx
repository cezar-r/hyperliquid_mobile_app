import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/DirectionSelector.styles';

interface DirectionSelectorProps {
  toPerp: boolean;
  onToggle: (toPerp: boolean) => void;
}

export const DirectionSelector: React.FC<DirectionSelectorProps> = ({ toPerp, onToggle }) => {
  return (
    <View style={styles.directionContainer}>
      <TouchableOpacity
        style={[
          styles.directionButton,
          toPerp && styles.directionButtonActive,
        ]}
        onPress={() => onToggle(true)}
      >
        <Text
          style={[
            styles.directionButtonText,
            toPerp && styles.directionButtonTextActive,
          ]}
        >
          Spot → Perp
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.directionButton,
          !toPerp && styles.directionButtonActive,
        ]}
        onPress={() => onToggle(false)}
      >
        <Text
          style={[
            styles.directionButtonText,
            !toPerp && styles.directionButtonTextActive,
          ]}
        >
          Perp → Spot
        </Text>
      </TouchableOpacity>
    </View>
  );
};


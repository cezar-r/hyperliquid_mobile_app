import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { playPrimaryButtonHaptic } from '../../../../lib/haptics';
import { styles } from '../styles/SearchTradeBar.styles';

interface SearchTradeBarProps {
  searchActive: boolean;
  searchQuery: string;
  onSearchQueryChange: (text: string) => void;
  onSearchActivate: () => void;
  onSearchDeactivate: () => void;
  onTradePress: () => void;
}

export default function SearchTradeBar({
  searchActive,
  searchQuery,
  onSearchQueryChange,
  onSearchActivate,
  onSearchDeactivate,
  onTradePress,
}: SearchTradeBarProps): React.JSX.Element {
  const handleSearchPress = () => {
    playPrimaryButtonHaptic();
    onSearchActivate();
  };

  const handleClosePress = () => {
    playPrimaryButtonHaptic();
    onSearchDeactivate();
  };

  const handleTradePress = () => {
    playPrimaryButtonHaptic();
    onTradePress();
  };

  return (
    <View style={styles.container}>
      {!searchActive ? (
        // Chart view: Search icon button + Trade button
        <>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={handleSearchPress}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={24} color={Color.BRIGHT_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.tradeButton]}
            onPress={handleTradePress}
            activeOpacity={0.8}
          >
            <Text style={styles.tradeButtonText}>Trade</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Search view: X button + Trade button
        <>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={handleClosePress}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={Color.FG_1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.tradeButton]}
            onPress={handleTradePress}
            activeOpacity={0.8}
          >
            <Text style={styles.tradeButtonText}>Trade</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}


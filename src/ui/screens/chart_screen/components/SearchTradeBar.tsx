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
  isDetailView?: boolean;
}

export default function SearchTradeBar({
  searchActive,
  searchQuery,
  onSearchQueryChange,
  onSearchActivate,
  onSearchDeactivate,
  onTradePress,
  isDetailView = false,
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
    if (searchActive) return; // Disabled during search
    playPrimaryButtonHaptic();
    onTradePress();
  };

  return (
    <View style={[styles.container, isDetailView && styles.containerDetailView]}>
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
        // Search view: X button + Trade button (disabled)
        <>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={handleClosePress}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={Color.FG_1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.tradeButton, styles.tradeButtonDisabled]}
            onPress={handleTradePress}
            activeOpacity={1}
            disabled={true}
          >
            <Text style={styles.tradeButtonTextDisabled}>Trade</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}


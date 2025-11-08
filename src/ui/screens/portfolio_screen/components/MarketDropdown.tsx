import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/MarketDropdown.styles';
import MarketDropdownOption from './MarketDropdownOption';

export type MarketFilter = 'Perp' | 'Spot' | 'Staking' | 'Perp+Spot' | 'Account';

interface MarketDropdownProps {
  selectedFilter: MarketFilter;
  isVisible: boolean;
  onToggle: () => void;
  onFilterChange: (filter: MarketFilter) => void;
}

export default function MarketDropdown({
  selectedFilter,
  isVisible,
  onToggle,
  onFilterChange,
}: MarketDropdownProps): React.JSX.Element {
  const options: MarketFilter[] = ['Perp', 'Spot', 'Staking', 'Perp+Spot', 'Account'];

  return (
    <>
      <View style={styles.marketDropdownContainer}>
        <TouchableOpacity style={styles.marketDropdownButton} onPress={onToggle}>
          <Text style={styles.marketDropdownButtonText}>{selectedFilter}</Text>
          <Text style={styles.marketDropdownArrow}>{isVisible ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      {/* Dropdown Backdrop and Menu - rendered for proper z-index */}
      {isVisible && (
        <>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={onToggle}
          />
          <View style={styles.marketDropdownMenuOverlay}>
            {options.map((option) => (
              <MarketDropdownOption
                key={option}
                label={option}
                isSelected={selectedFilter === option}
                onPress={() => onFilterChange(option)}
              />
            ))}
          </View>
        </>
      )}
    </>
  );
}


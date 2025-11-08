import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Color from '../../../styles/colors';
import { styles } from '../styles/SortButtons.styles';

export enum SortType {
  ALPHABETICAL = 'A-Z',
  VOLUME = '24h Volume',
  CHANGE = '24h Change %',
  FUNDING = 'Funding',
  LEVERAGE = 'Leverage',
  OPEN_INTEREST = 'Open Interest',
  MARKET_CAP = 'Market Cap',
}

interface SortButtonsProps {
  sortOptions: SortType[];
  currentSort: SortType;
  isAscending: boolean;
  showStarredOnly: boolean;
  onSortPress: (sortType: SortType) => void;
  onStarFilterToggle: () => void;
}

export default function SortButtons({
  sortOptions,
  currentSort,
  isAscending,
  showStarredOnly,
  onSortPress,
  onStarFilterToggle,
}: SortButtonsProps): React.JSX.Element {
  return (
    <View style={styles.sortHeaderContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortScrollContent}
      >
        <TouchableOpacity style={styles.sortButton} onPress={onStarFilterToggle}>
          <Ionicons
            name={showStarredOnly ? 'star' : 'star-outline'}
            size={16}
            color={showStarredOnly ? Color.GOLD : Color.FG_3}
          />
        </TouchableOpacity>
        {sortOptions.map((sortType) => (
          <TouchableOpacity
            key={sortType}
            style={[
              styles.sortButton,
              currentSort === sortType && styles.sortButtonActive,
            ]}
            onPress={() => onSortPress(sortType)}
          >
            <Text
              style={[
                styles.sortButtonText,
                currentSort === sortType && styles.sortButtonTextActive,
              ]}
            >
              {sortType}
            </Text>
            {currentSort === sortType && (
              <Ionicons
                name={isAscending ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Color.BG_2}
                style={styles.sortIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}


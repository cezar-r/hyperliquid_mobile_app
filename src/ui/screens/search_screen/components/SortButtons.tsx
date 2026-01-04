import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/SortButtons.styles';
import { playOptionSelectionHaptic } from '../../../../lib/haptics';

const HyperliquidBlobActive = require('../../../../../assets/blob-dark.gif');
const HyperliquidBlobInactive = require('../../../../../assets/blob_green.gif');

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
  showHip3Only: boolean;
  showHip3Toggle: boolean;
  onSortPress: (sortType: SortType) => void;
  onStarFilterToggle: () => void;
  onHip3FilterToggle: () => void;
}

export default function SortButtons({
  sortOptions,
  currentSort,
  isAscending,
  showStarredOnly,
  showHip3Only,
  showHip3Toggle,
  onSortPress,
  onStarFilterToggle,
  onHip3FilterToggle,
}: SortButtonsProps): React.JSX.Element {
  return (
    <View style={styles.sortHeaderContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortScrollContent}
      >
        <TouchableOpacity style={styles.sortButton} onPress={() => {
          playOptionSelectionHaptic();
          onStarFilterToggle();
        }}>
          <Ionicons
            name={showStarredOnly ? 'star' : 'star-outline'}
            size={16}
            color={showStarredOnly ? Color.GOLD : Color.FG_3}
          />
        </TouchableOpacity>
        {showHip3Toggle && (
          <TouchableOpacity
            style={[
              styles.sortButton,
              showHip3Only && {
                backgroundColor: Color.BRIGHT_ACCENT,
                borderRadius: 8,
                paddingHorizontal: 8,
              }
            ]}
            onPress={() => {
              playOptionSelectionHaptic();
              onHip3FilterToggle();
            }}
          >
            <Image
              source={showHip3Only ? HyperliquidBlobActive : HyperliquidBlobInactive}
              style={showHip3Only ? { width: 21, height: 21 } : { width: 16, height: 16 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        {sortOptions.map((sortType) => (
          <TouchableOpacity
            key={sortType}
            style={[
              styles.sortButton,
              currentSort === sortType && styles.sortButtonActive,
            ]}
            onPress={() => {
              playOptionSelectionHaptic();
              onSortPress(sortType);
            }}
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


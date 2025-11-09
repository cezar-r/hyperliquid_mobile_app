import React from 'react';
import { View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { styles } from '../styles/MarketDropdown.styles';
import { Color } from '../../../shared/styles';

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
  const items = [
    { label: 'Perp', value: 'Perp' as MarketFilter },
    { label: 'Spot', value: 'Spot' as MarketFilter },
    { label: 'Staking', value: 'Staking' as MarketFilter },
    { label: 'Perp+Spot', value: 'Perp+Spot' as MarketFilter },
    { label: 'Account', value: 'Account' as MarketFilter },
  ];

  return (
    <>
      <View style={styles.marketDropdownContainer}>
        <DropDownPicker
          open={isVisible}
          value={selectedFilter}
          items={items}
          setOpen={(callback) => {
            // Handle both function and boolean
            if (typeof callback === 'function') {
              const newValue = callback(isVisible);
              if (newValue !== isVisible) {
                onToggle();
              }
            } else if (callback !== isVisible) {
              onToggle();
            }
          }}
          setValue={(callback) => {
            const newValue = typeof callback === 'function' ? callback(selectedFilter) : callback;
            if (newValue !== null) {
              onFilterChange(newValue);
            }
          }}
          style={styles.dropdownStyle}
          textStyle={styles.dropdownTextStyle}
          dropDownContainerStyle={styles.dropDownContainerStyle}
          arrowIconStyle={styles.arrowIconStyle}
          tickIconStyle={styles.tickIconStyle}
          listItemContainerStyle={styles.listItemContainerStyle}
          selectedItemContainerStyle={styles.selectedItemContainerStyle}
          selectedItemLabelStyle={styles.selectedItemLabelStyle}
          listItemLabelStyle={styles.listItemLabelStyle}
          dropDownDirection="BOTTOM"
          zIndex={3000}
          zIndexInverse={1000}
          closeAfterSelecting={true}
          listMode="SCROLLVIEW"
        />
      </View>

      <View style={styles.separator} />
    </>
  );
}


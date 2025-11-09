import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  marketDropdownContainer: {
    zIndex: 3000,
    paddingHorizontal: spacing.md,
    marginBottom: 2,
  },
  dropdownStyle: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    minHeight: 48,
  },
  dropdownTextStyle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  dropDownContainerStyle: {
    backgroundColor: "#0b0f13",
    // borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0b0f13",
    marginTop: 4,
    paddingVertical: 0,
    maxHeight: 250,
  },
  arrowIconStyle: {
    width: 18,
    height: 18,
    tintColor: Color.FG_3,
  },
  tickIconStyle: {
    width: 18,
    height: 18,
    tintColor: Color.BRIGHT_ACCENT,
  },
  listItemContainerStyle: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  selectedItemContainerStyle: {
    backgroundColor: 'transparent',
  },
  selectedItemLabelStyle: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  listItemLabelStyle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: Color.BG_1,
  },
});


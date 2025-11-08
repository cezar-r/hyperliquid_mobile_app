import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  marketDropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_1,
  },
  marketDropdownItemText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '500',
  },
  marketDropdownItemTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


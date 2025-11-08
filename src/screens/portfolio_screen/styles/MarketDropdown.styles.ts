import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  marketDropdownContainer: {
    zIndex: 1000,
  },
  marketDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  marketDropdownButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  marketDropdownArrow: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    elevation: 1001,
    backgroundColor: 'transparent',
  },
  marketDropdownMenuOverlay: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    zIndex: 1002,
    elevation: 1002,
  },
  separator: {
    height: 1,
    backgroundColor: Color.BG_1,
  },
});


import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';
import { fontSizes } from '../../../../../shared/styles/typography';
import { spacing } from '../../../../../shared/styles/spacing';

export const styles = StyleSheet.create({
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  balanceValue: {
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  balanceValueNormal: {
    color: Color.FG_1,
  },
});


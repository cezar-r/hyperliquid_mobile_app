import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  balanceContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 14,
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 6,
  },
  depositTextButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  depositButtonText: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  pnlText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginTop: 0,
  },
  pnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  pnlNegative: {
    color: Color.RED,
  },
});


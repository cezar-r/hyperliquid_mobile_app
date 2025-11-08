import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  stakingSummaryItem: {
    flex: 1,
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.BG_1,
  },
  stakingLabel: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  stakingValue: {
    fontSize: 15,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stakingSubtext: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
});


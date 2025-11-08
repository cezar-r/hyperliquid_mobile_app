import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

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


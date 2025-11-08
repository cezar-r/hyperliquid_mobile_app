import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  recentTradesContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },
  showMoreButton: {
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
    marginTop: spacing.sm,
  },
  showMoreText: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '600',
  },
});


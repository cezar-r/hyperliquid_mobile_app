import { StyleSheet } from 'react-native';
import { Color, spacing, fontSizes } from '../../../styles';

export const styles = StyleSheet.create({
  recentTradesContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: Color.FG_3,
    paddingVertical: 12,
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


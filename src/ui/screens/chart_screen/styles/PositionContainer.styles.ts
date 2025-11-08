import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  positionsContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xs,
  },
  marketCloseButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  marketCloseText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
  },
});


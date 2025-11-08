import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  volumeContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  volumeLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  volumeValue: {
    fontSize: 16,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


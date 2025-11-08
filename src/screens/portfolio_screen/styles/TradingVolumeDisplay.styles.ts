import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

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


import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
});


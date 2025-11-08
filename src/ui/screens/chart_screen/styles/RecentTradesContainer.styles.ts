import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  recentTradesContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: Color.FG_3,
    paddingVertical: 12,
  },
});


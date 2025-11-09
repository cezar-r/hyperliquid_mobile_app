import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  balancesLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    paddingTop: 6,
    marginTop: 16,
  },
  spotSection: {
    marginTop: 8,
  },
});


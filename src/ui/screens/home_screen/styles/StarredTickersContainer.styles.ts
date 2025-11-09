import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 4,
    marginBottom: 2,
  },
  balancesLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    paddingTop: 6,
  },
  starredSection: {
    marginTop: 32,
  },
  spotSection: {
    marginTop: 20,
  },
});


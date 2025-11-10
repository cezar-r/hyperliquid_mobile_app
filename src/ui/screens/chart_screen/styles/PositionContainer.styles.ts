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
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: 10,
    marginTop: -8,
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: Color.FG_3,
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 12,
    color: Color.FG_1,
    fontWeight: '400',
  },
  marketCloseButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  marketCloseText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
  },
});


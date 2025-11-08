import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  delegationCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.BG_1,
  },
  delegationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  delegationValidator: {
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  delegationAmount: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  delegationAddress: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  undelegateButton: {
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.RED,
  },
  undelegateButtonText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
  },
});


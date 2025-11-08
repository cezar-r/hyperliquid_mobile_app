import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';
import { fontSizes } from '../../../../../shared/styles/typography';
import { spacing } from '../../../../../shared/styles/spacing';

export const styles = StyleSheet.create({
  validatorCard: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  delegateVariant: {
    borderColor: Color.BRIGHT_ACCENT,
  },
  undelegateVariant: {
    borderColor: Color.BRIGHT_ACCENT,
  },
  validatorLabel: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  validatorName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  delegateText: {
    color: Color.BRIGHT_ACCENT,
  },
  undelegateText: {
    color: Color.BRIGHT_ACCENT,
  },
  validatorAddress: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    fontFamily: 'monospace',
  },
});


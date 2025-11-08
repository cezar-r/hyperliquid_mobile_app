import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';
import { spacing } from '../../../../../shared/styles/spacing';

export const styles = StyleSheet.create({
  // Default error variant (used in Deposit/Withdraw modals)
  errorWarningBox: {
    backgroundColor: Color.DARK_RED,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  // Info variant (used in Delegate/Undelegate modals)
  infoWarningBox: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  // Danger variant (used in Undelegate modal)
  dangerWarningBox: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.RED,
  },
});


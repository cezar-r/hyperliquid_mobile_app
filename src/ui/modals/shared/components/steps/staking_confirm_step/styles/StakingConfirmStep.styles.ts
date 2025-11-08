import { StyleSheet } from 'react-native';
import { Color } from '../../../../../../shared/styles/colors';
import { fontSizes } from '../../../../../../shared/styles/typography';
import { spacing } from '../../../../../../shared/styles/spacing';

export const styles = StyleSheet.create({
  confirmSection: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  confirmLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  confirmValue: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  warningText: {
    fontSize: fontSizes.sm,
    color: Color.FG_2,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  cancelButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDanger: {
    backgroundColor: Color.RED,
  },
  confirmButtonText: {
    fontSize: fontSizes.md,
    color: Color.BG_2,
    fontWeight: '600',
  },
});


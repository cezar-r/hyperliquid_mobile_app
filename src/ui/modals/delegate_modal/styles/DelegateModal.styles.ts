import { StyleSheet, Dimensions } from 'react-native';
import { Color } from '../../../shared/styles/colors';
import { fontSizes } from '../../../shared/styles/typography';
import { spacing } from '../../../shared/styles/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Color.BG_2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  balanceValue: {
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
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
  confirmButtonText: {
    fontSize: fontSizes.md,
    color: Color.BG_2,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
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
});


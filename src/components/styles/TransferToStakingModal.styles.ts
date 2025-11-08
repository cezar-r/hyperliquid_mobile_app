import { StyleSheet, Dimensions } from 'react-native';
import Color from '../../ui/shared/styles/colors';
import { fontSizes } from '../../ui/shared/styles/typography';
import { spacing } from '../../ui/shared/styles/spacing';

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Color.ACCENT,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Color.FG_1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Color.FG_2,
    fontWeight: '300',
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_2,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.lg,
    color: Color.FG_1,
    paddingVertical: spacing.md,
    fontWeight: '500',
  },
  maxButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: Color.ACCENT,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: fontSizes.xs,
    color: Color.FG_1,
    fontWeight: '700',
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
    fontWeight: '700',
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
  statusContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  statusText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  statusHint: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: Color.BRIGHT_ACCENT,
  },
  errorIcon: {
    fontSize: 64,
    color: Color.RED,
  },
});


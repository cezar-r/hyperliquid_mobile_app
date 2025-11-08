import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  accountDetailsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  depositButton: {
    flex: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButtonText: {
    fontSize: 15,
    color: Color.BG_2,
    fontWeight: '600',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  withdrawButtonText: {
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
  },
  transferContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  transferButton: {
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  transferButtonText: {
    fontSize: 15,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


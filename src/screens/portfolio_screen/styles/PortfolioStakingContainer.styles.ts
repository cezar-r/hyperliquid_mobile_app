import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  stakingSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },
  stakingCard: {
    // No background styling - blends with page
  },
  stakingSummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stakingButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
  delegateButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  delegateButtonText: {
    fontSize: fontSizes.md,
    color: Color.BG_2,
    fontWeight: '600',
  },
  delegationsContainer: {
    marginTop: spacing.lg,
  },
  delegationsTitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
});


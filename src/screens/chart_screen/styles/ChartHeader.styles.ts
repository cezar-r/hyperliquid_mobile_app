import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  tickerHeader: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#0b0f13',
    marginBottom: 0,
  },
  backButtonRow: {
    paddingTop: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingTop: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: 36,
    color: Color.FG_1,
    fontWeight: '300',
    lineHeight: 36,
  },
  tickerTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  tickerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  tickerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceRightGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  tickerName: {
    fontSize: fontSizes.xl,
    color: Color.FG_1,
    fontWeight: '600',
    paddingTop: spacing.xs,
  },
  leverageBadge: {
    backgroundColor: Color.ACCENT,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  leverageText: {
    fontSize: fontSizes.xs,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: fontSizes.lg,
    color: Color.FG_1,
    fontWeight: '600',
    paddingTop: spacing.xs,
  },
  priceChangePositive: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
    paddingTop: spacing.xs,
  },
  priceChangeNegative: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
    paddingTop: spacing.xs,
  },
  marketTypeLabel: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
    borderWidth: 1,
    borderColor: Color.BG_3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statsScrollView: {
    flex: 1,
  },
  statsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  statValue: {
    fontSize: fontSizes.xs,
    color: Color.FG_1,
    fontWeight: '500',
  },
  statValuePositive: {
    fontSize: fontSizes.xs,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '500',
  },
  statValueNegative: {
    fontSize: fontSizes.xs,
    color: Color.RED,
    fontWeight: '500',
  },
});


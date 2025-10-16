import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    color: Color.FG_1,
    marginBottom: spacing.lg,
  },
  addressContainer: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  addressLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: fontSizes.md,
    color: Color.ACCENT,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#FF6B6B',
  },
  summaryContainer: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    color: Color.FG_1,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
  },
  summaryValue: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  summaryValueHighlight: {
    fontSize: fontSizes.md,
    color: Color.ACCENT,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Color.FG_3,
    opacity: 0.1,
    marginVertical: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    textAlign: 'center',
  },
  wsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  wsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Color.ACCENT,
    marginRight: spacing.sm,
  },
  wsStatusText: {
    fontSize: fontSizes.sm,
    color: Color.FG_2,
  },
  wsErrorContainer: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginBottom: spacing.md,
  },
  wsErrorText: {
    fontSize: fontSizes.sm,
    color: '#FF6B6B',
  },
  priceCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: Color.ACCENT,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coinName: {
    fontSize: fontSizes.xl,
    color: Color.FG_1,
    fontWeight: '700',
  },
  marketTypeBadge: {
    fontSize: fontSizes.xs,
    color: Color.ACCENT,
    backgroundColor: Color.BG_2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 32,
    color: Color.ACCENT,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  priceLoading: {
    fontSize: fontSizes.lg,
    color: Color.FG_3,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  priceSubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lastUpdated: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    fontStyle: 'italic',
  },
  portfolioValueCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Color.BRIGHT_ACCENT,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  portfolioLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    fontSize: 32,
    color: Color.FG_1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  portfolioPnL: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  pnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  pnlNegative: {
    color: Color.RED,
  },
  positionItem: {
    paddingVertical: spacing.sm,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  positionCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  positionDirection: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  directionLong: {
    color: Color.BRIGHT_ACCENT,
    backgroundColor: Color.BG_2,
  },
  directionShort: {
    color: Color.RED,
    backgroundColor: Color.BG_2,
  },
  positionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  positionDetailText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  positionPnLRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  positionPnL: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  balanceCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  balanceAmounts: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '500',
  },
  balanceUsd: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: Color.RED,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: Color.FG_1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  closeButtonDisabled: {
    backgroundColor: Color.FG_3,
    opacity: 0.5,
  },
});


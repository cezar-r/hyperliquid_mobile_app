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
    fontWeight: '700',
    color: Color.FG_1,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  
  // Wallet Card
  walletCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  walletLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  walletAddress: {
    fontSize: fontSizes.md,
    color: Color.ACCENT,
    fontWeight: '600',
  },
  
  // Loading and Error States
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
    borderColor: Color.RED,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: Color.RED,
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
  
  // Summary Card
  summaryCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Color.BRIGHT_ACCENT,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
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
  
  // Details Card
  detailsCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  detailValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
  
  // Position Card
  positionCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  positionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  positionDetailLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  positionDetailValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
  positionPnL: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '500',
  },
  balanceUsd: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xs,
  },
  
  // Order Card
  orderCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  orderSide: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sideBuy: {
    color: Color.BRIGHT_ACCENT,
    backgroundColor: Color.BG_2,
  },
  sideSell: {
    color: Color.RED,
    backgroundColor: Color.BG_2,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  orderLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  orderValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
  
  // Trade Card
  tradeCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tradeCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  tradeSide: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tradeDetail: {
    paddingVertical: spacing.xs,
  },
  tradeLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_2,
    marginBottom: 2,
  },
  tradeTime: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginTop: 2,
  },
  tradePnl: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});

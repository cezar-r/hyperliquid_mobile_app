import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },

  // Market Filter Selector
  filterContainer: {
    paddingTop: spacing.md,
  },
  panelSelector: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  panelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  panelText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '500',
  },
  panelTextActive: {
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    height: 1,
    paddingHorizontal: spacing.md,
  },
  separatorSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Color.BG_1,
  },
  separatorActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },

  // Recent Trades Section
  recentTradesContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: spacing.md,
  },
  tradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#0b0f13',
  },
  cellSeparator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
  tradeLeftSide: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tradeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  tradeCoin: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  tradeSide: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 3,
  },
  sideBuy: {
    color: Color.BRIGHT_ACCENT,
    backgroundColor: Color.BG_2,
  },
  sideSell: {
    color: Color.RED,
    backgroundColor: Color.BG_2,
  },
  tradePnl: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  pnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  pnlNegative: {
    color: Color.RED,
  },
  tradeTime: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  tradeRightSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tradePrice: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  tradeSize: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  showMoreButton: {
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
    marginTop: spacing.sm,
  },
  showMoreText: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '600',
  },

  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: Color.BG_1,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.RED,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: Color.RED,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    textAlign: 'center',
  },
});

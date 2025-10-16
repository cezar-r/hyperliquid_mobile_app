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

  // Market Filter Dropdown
  marketDropdownContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 1000,
  },
  marketDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  marketDropdownButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  marketDropdownArrow: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  marketDropdownMenu: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    overflow: 'hidden',
    zIndex: 1001,
  },
  marketDropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_1,
  },
  marketDropdownItemText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '500',
  },
  marketDropdownItemTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
  },

  // Time Filter
  timeFilterContainer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  timeFilterSelector: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  timeFilterText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '500',
  },
  timeFilterTextActive: {
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  timeSeparatorContainer: {
    flexDirection: 'row',
    height: 1,
  },
  timeSeparatorSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Color.BG_1,
  },
  timeSeparatorActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },

  // Trading Volume Display
  volumeContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    // paddingBottom: spacing.sm,
  },
  volumeLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  volumeValue: {
    fontSize: fontSizes.lg,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
  },

  // Portfolio Value Component
  portfolioValueContainer: {
    paddingHorizontal: spacing.md,
    // paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  portfolioValueLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    fontSize: 42,
    color: Color.FG_1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  portfolioPnL: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  pnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  pnlNegative: {
    color: Color.RED,
  },
  
  // Equity Breakdown
  equityBreakdownContainer: {
    marginTop: spacing.sm,
    width: '100%',
  },
  equityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  equityLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  equityValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },

  // Account Details (simplified)
  accountDetailsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  accountDetailsTitle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    marginBottom: spacing.sm,
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
  
  // Action Buttons (Deposit/Withdraw)
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
    fontSize: fontSizes.md,
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
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },

  // Transfer Button (Perp <-> Spot)
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
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },

  // Positions Container (from HomeScreen)
  positionsContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  
  // Section Label (from HomeScreen)
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },

  // Position Cell (from HomeScreen)
  positionCell: {
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Color.BG_1,
  },
  leftSide: {
    justifyContent: 'space-between',
  },
  rightSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  ticker: {
    color: Color.FG_1,
    fontSize: 17,
    fontWeight: 'bold',
  },
  leverage: {
    fontSize: 16,
    marginBottom: 0,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  size: {
    color: Color.FG_3,
    fontSize: 12,
  },
  priceChange: {
    fontSize: 10,
    marginTop: 2,
  },
  price: {
    color: Color.FG_1,
    fontSize: 16,
    marginBottom: 0,
    fontWeight: 'bold'
  },
  pnl: {
    fontSize: 12,
  },

  // Staking Section
  stakingSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  stakingCard: {
    // No background styling - blends with page
  },
  stakingSummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stakingSummaryItem: {
    flex: 1,
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.BG_1,
  },
  stakingLabel: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  stakingValue: {
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stakingSubtext: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  stakingButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  stakingButton: {
    flex: 1,
    backgroundColor: Color.ACCENT,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  stakingButtonText: {
    fontSize: fontSizes.sm,
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
    fontWeight: '700',
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
  delegationCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.BG_1,
  },
  delegationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  delegationValidator: {
    fontSize: fontSizes.md,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
  },
  delegationAmount: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  delegationAddress: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  undelegateButton: {
    backgroundColor: Color.BG_3,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.RED,
  },
  undelegateButtonText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
  },

  // Open Orders Section (compact style like ChartScreen)
  openOrdersContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: spacing.md,
  },
  orderCard: {
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Color.BG_1,
  },
  orderLeftSide: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderCoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  orderCoin: {
    color: Color.FG_1,
    fontSize: 17,
    fontWeight: 'bold',
  },
  orderSide: {
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
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderPrice: {
    color: Color.FG_3,
    fontSize: 12,
  },
  orderSize: {
    color: Color.FG_3,
    fontSize: 12,
  },
  cancelOrderButton: {
    backgroundColor: Color.BG_2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Color.RED,
  },
  cancelOrderButtonText: {
    color: Color.RED,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },

  // Recent Trades Section (search-style layout)
  recentTradesContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  tradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Color.BG_1,
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
  tradePnl: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
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

  // Separator (from ChartScreen)
  separator: {
    height: 1,
    backgroundColor: Color.BG_1,
    // marginVertical: spacing.md,
  },
});

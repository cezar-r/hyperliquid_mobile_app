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

  // Market Filter Dropdown
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
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    height: 1,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  separatorSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Color.BG_1,
  },
  separatorActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  slidingSeparator: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    width: '30.33%', // 1/3 of the available width minus padding
    height: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: 3,
  },

  // Balance Display
  balanceContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 6,
  },

  // Positions Container
  positionsContainer: {
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  
  // Section Label
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 4,
    // marginTop: 8,
  },

  sectionLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  starIcon: {
    marginRight: 4,
    marginBottom: 4,
  },

  balancesLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    // marginBottom: 1,
    paddingTop: 6,
  },

  // Perps Header Row
  perpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeAllText: {
    color: Color.RED,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Spot Section Spacing
  spotSection: {
    marginTop: 20,
  },

  // Staking Section Spacing
  stakingSection: {
    marginTop: 28,
  },

  // Starred Section Spacing
  starredSection: {
    marginTop: 32,
  },

  // Position Cell Container
  positionCellContainer: {
    width: '100%',
  },
  
  // Position Cell (for both perp and spot)
  positionCell: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0f13',
  },
  
  // TP/SL Inline Styles
  tpslInline: {
    fontSize: 11,
    color: Color.FG_3,
    marginTop: 2,
  },
  editTpslIcon: {
    marginLeft: 6,
  },
  
  separator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
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
    fontSize: 15,
    fontWeight: '600',
  },
  leverage: {
    fontSize: 15,
    marginBottom: 0,
    fontWeight: 'bold',
  },
  leverageTypeBadge: {
    fontSize: 10,
    color: Color.BRIGHT_ACCENT,
    backgroundColor: Color.ACCENT,
    borderWidth: 1,
    borderColor: Color.BG_3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 4,
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
    fontSize: 15,
    marginBottom: 0,
    fontWeight: '600'
  },
  pnl: {
    fontSize: 12,
  },

  // Loading & Error States
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

  // Empty State
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

  // Deposit Button (text button below balance)
  depositTextButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  depositButtonText: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


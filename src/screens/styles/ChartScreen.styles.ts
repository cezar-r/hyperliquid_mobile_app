import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120, // Add padding to prevent buy/sell buttons from covering content
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xs,
  },
  panelSelector: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Color.BG_3,
  },
  separatorContainer: {
    flexDirection: 'row',
    height: 1,
  },
  separatorSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Color.BG_3,
  },
  separatorActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    // backgroundColor: Color.BG_3,
    // borderRadius: 4,
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: Color.BG_3,
  },
  intervalButtonActive: {
    // backgroundColor: Color.BG_1,
    borderColor: Color.ACCENT,
  },
  intervalText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '500',
  },
  intervalTextActive: {
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  chartContainer: {
    // backgroundColor: Color.BG_3,
    borderRadius: 12,
    // padding: spacing.md,
    // marginBottom: spacing.lg,
  },
  orderbookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  obControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  obColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  obHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  obColumnsWithDropdown: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  obColText: {
    color: Color.FG_3,
  },
  obColTextPrice: {
    color: Color.FG_3,
    marginLeft: 0,
  },
  obColTextSize: {
    color: Color.FG_3,
    marginRight: 0,
  },
  obRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  obDepthAsk: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 59, 59, 0.15)',
  },
  obDepthBid: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 148, 0.12)',
  },
  obPx: { color: Color.FG_1 },
  obSz: { color: Color.FG_3 },
  tradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tradePrice: {
    flex: 1,
    fontSize: fontSizes.sm,
  },
  tradePriceBid: {
    color: Color.BRIGHT_ACCENT,
  },
  tradePriceAsk: {
    color: Color.RED,
  },
  tradeSize: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    textAlign: 'center',
  },
  tradeTimeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  tradeTime: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  tradeExplorerLink: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
  },
  obDropdown: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: Color.BG_2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.BG_2,
  },
  tickDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    // paddingVertical: spacing.xs,
    // borderRadius: 4,
    // borderWidth: 1,
    // borderColor: Color.BG_3,
    width: 70,
  },
  tickDropdownValue: {
    fontSize: fontSizes.xs,
    color: Color.FG_1,
    fontWeight: '500',
  },
  tickDropdownArrow: {
    fontSize: 10,
    color: Color.FG_3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickDropdownMenu: {
    backgroundColor: Color.BG_2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.BG_3,
    minWidth: 120,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tickDropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  tickDropdownItemActive: {
    backgroundColor: Color.ACCENT,
  },
  tickDropdownItemText: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    textAlign: 'center',
  },
  tickDropdownItemTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: '#0b0f13',
    borderRadius: 12,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  orderbookLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 460,
  },
  tradesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 460,
  },
  errorContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FF4444',
    marginVertical: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#FF4444',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Color.BG_2,
  },
  infoText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  tickerHeader: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#0b0f13',
    marginBottom: 0,
  },
  backButtonRow: {
    paddingTop: spacing.xl,
    // paddingBottom: spacing.xs,
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
    // marginBottom: spacing.xs,
  },
  tickerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  tickerLeft: {
    flex: 1,
  },
  tickerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tickerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  marketTypeLabel: {
    fontSize: fontSizes.sm,
    color: Color.BRIGHT_ACCENT,
    borderWidth: 1,
    borderColor: Color.BG_3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    // backgroundColor: Color.BG_2,
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
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
  tickerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceRightGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  chartIntervalHeader: {
    flexDirection: 'row',
    backgroundColor: '#0b0f13',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: 0,
  },
  chartIntervalButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: '#161b22',
  },
  chartIntervalText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '400',
  },
  chartIntervalTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  starButton: {
    marginLeft: 'auto',
    // paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Order Buttons (sticky at bottom)
  orderButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#0b0f13',
    borderTopWidth: 1,
    borderTopColor: Color.BG_3,
    paddingBottom: spacing.lg,
  },
  orderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  orderButtonBuy: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  orderButtonSell: {
    backgroundColor: Color.RED,
  },
  orderButtonTextBuy: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Color.FG_2,
    letterSpacing: 0.5,
  },
  orderButtonTextSell: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Color.FG_1,
    letterSpacing: 0.5,
  },
  
  // Position Display Styles
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  positionDirection: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  positionLong: {
    color: Color.BRIGHT_ACCENT,
  },
  positionShort: {
    color: Color.RED,
  },
  positionSize: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Color.FG_1,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  positionLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  positionValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
  positionPnl: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  positionPnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  positionPnlNegative: {
    color: Color.RED,
  },
  positionLiqPrice: {
    color: Color.RED,
  },
  
  // Balance Display Styles
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  balanceCoin: {
    fontSize: fontSizes.sm,
    color: Color.FG_2,
    fontWeight: '500',
  },
  balanceValues: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
  balanceUsd: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginTop: 2,
  },
  
  // Close Position Button
  closeButton: {
    backgroundColor: Color.RED,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: Color.FG_1,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  closeButtonDisabled: {
    backgroundColor: Color.FG_3,
    opacity: 0.5,
  },
  
  // Position Cell Styles (from HomeScreen/PortfolioScreen)
  positionsContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
  },
  positionCellContainer: {
    width: '100%',
  },
  positionCell: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0f13',
  },
  tpslInline: {
    fontSize: 11,
    color: Color.FG_3,
    marginTop: 2,
  },
  editTpslIcon: {
    marginLeft: 6,
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
    fontSize: 16,
    marginBottom: 0,
    fontWeight: 'bold',
  },
  pnl: {
    fontSize: 12,
  },
  
  // Recent Trades Section (from PortfolioScreen)
  recentTradesContainer: {
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
  tradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#0b0f13',
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
    fontWeight: '600',
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
  tradeRightSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tradeCardTime: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  tradeCardPrice: {
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tradeCardSize: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  
  // Market Close Button
  marketCloseButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  marketCloseText: {
    fontSize: fontSizes.sm,
    color: Color.RED,
    fontWeight: '600',
  },
  
  // Open Orders Section
  openOrdersContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  orderCard: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0b0f13',
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
    fontWeight: '600',
  },
  orderSide: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 3,
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
  
  // Cell Separator
  cellSeparator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
  
  // Fixed Height Containers for All Panels
  chartFixedContainer: {
    minHeight: 400,
  },
  orderbookFixedContainer: {
    minHeight: 400,
  },
  obHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  obSplitContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  obColumn: {
    flex: 1,
  },
  obColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  obColHeaderText: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    fontWeight: '600',
  },
  obRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  obPxSplit: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  obPxBid: {
    color: Color.BRIGHT_ACCENT,
  },
  obPxAsk: {
    color: Color.RED,
  },
  obSzSplit: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  obDepthBidSplit: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 148, 0.12)',
  },
  obDepthAskSplit: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 59, 59, 0.15)',
  },
  
  // Fixed Trades Container
  tradesFixedContainer: {
    minHeight: 460,
  },
  tradesScrollContainer: {
    maxHeight: 400,
  },
});


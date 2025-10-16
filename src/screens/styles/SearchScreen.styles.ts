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
  
  // Market Type Toggle (Perp/Spot)
  marketTypeSection: {
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
  panelButtonActive: {
    // Active state is handled by the separator
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
  },
  separatorSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Color.BG_3,
  },
  separatorActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.DARK_ACCENT,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 5,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Color.FG_1,
    fontSize: 16,
    paddingVertical: 16,
  },
  clearButton: {
    padding: spacing.xs,
  },

  // Sort Header
  sortHeaderContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sortScrollContent: {
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    marginRight: spacing.xs,
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: Color.BG_1,
    marginBottom: spacing.md,
  },
  sortButtonActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  sortButtonText: {
    color: Color.FG_1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortButtonTextActive: {
    color: Color.BG_2,
    fontWeight: '600',
  },
  sortIcon: {
    marginLeft: 4,
  },

  // Market List
  marketList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  tickerCell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0b0f13',
  },
  separator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
  
  // Ticker Left Side
  tickerLeftContainer: {
    flex: 1,
    gap: 4,
  },
  tickerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerSymbol: {
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '600',
  },
  leverage: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Color.BRIGHT_ACCENT,
  },
  tickerMetricBelow: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Ticker Right Side
  tickerRightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tickerPrice: {
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '600',
  },
  tickerMetric: {
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
});

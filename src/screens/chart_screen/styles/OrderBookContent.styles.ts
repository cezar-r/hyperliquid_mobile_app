import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

const CHART_CONTAINER_HEIGHT = 436;

export const styles = StyleSheet.create({
  orderbookFixedContainer: {
    height: CHART_CONTAINER_HEIGHT,
  },
  orderbookLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CHART_CONTAINER_HEIGHT,
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  obHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tickDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
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
});


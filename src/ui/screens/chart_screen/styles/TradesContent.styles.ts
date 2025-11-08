import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

const CHART_CONTAINER_HEIGHT = 436;

export const styles = StyleSheet.create({
  tradesFixedContainer: {
    height: CHART_CONTAINER_HEIGHT,
  },
  tradesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CHART_CONTAINER_HEIGHT,
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  tradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  obColText: {
    color: Color.FG_3,
  },
  tradesScrollContainer: {
    maxHeight: CHART_CONTAINER_HEIGHT - 30,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs - 2,
    paddingHorizontal: spacing.md,
  },
  tradePrice: {
    flex: 1,
    fontSize: fontSizes.xs,
  },
  tradePriceBid: {
    color: Color.BRIGHT_ACCENT,
  },
  tradePriceAsk: {
    color: Color.RED,
  },
  tradeSize: {
    flex: 1,
    fontSize: fontSizes.xs,
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
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
  tradeExplorerLink: {
    fontSize: fontSizes.xs,
    color: Color.BRIGHT_ACCENT,
  },
});


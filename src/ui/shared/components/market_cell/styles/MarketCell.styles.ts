import { StyleSheet } from 'react-native';
import { Color } from '../../../styles/colors';

export const styles = StyleSheet.create({
  cellWrapper: {
    position: 'relative',
  },
  tickerCell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0b0f13',
  },
  sparklineOverlay: {
    position: 'absolute',
    top: 0,
    left: '35%',
    right: '35%',
    bottom: 1, // Account for separator
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.4,
    marginLeft: 25,
    marginRight: -10,
  },
  tickerLeftContainer: {
    flex: 1,
    gap: 4,
    maxWidth: '38%',
  },
  tickerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  tickerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerSymbol: {
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '600',
  },
  tickerCollateral: {
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '600',
  },
  dexBadge: {
    backgroundColor: Color.ACCENT,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dexBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Color.FG_1,
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
  separator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
});


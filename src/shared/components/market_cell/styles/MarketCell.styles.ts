import { StyleSheet } from 'react-native';
import Color from '../../../../styles/colors';

export const styles = StyleSheet.create({
  tickerCell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0b0f13',
  },
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


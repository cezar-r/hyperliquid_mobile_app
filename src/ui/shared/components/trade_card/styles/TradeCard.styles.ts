import { StyleSheet } from 'react-native';
import { Color, fontSizes, spacing } from '../../../styles';

export const styles = StyleSheet.create({
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
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
  },
  tradeSide: {
    fontSize: 12,
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
    fontSize: 11,
    paddingTop: 2,
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
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tradeSize: {
    fontSize: 12,
    color: Color.FG_3,
  },
});



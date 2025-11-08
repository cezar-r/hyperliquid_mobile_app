import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

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
  sideTransfer: {
    color: Color.FG_1,
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
  ledgerDetails: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  tradeTime: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
  },
});


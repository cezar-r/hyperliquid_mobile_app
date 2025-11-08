import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  openOrdersContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 10,
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
  cellSeparator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
});


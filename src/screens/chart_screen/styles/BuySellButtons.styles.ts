import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
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
});


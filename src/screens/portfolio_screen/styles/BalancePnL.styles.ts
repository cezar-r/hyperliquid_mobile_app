import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';

export const styles = StyleSheet.create({
  portfolioPnL: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  pnlPositive: {
    color: Color.BRIGHT_ACCENT,
  },
  pnlNegative: {
    color: Color.RED,
  },
});


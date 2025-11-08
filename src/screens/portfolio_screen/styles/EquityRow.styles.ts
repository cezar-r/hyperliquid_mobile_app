import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  equityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  equityLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
  equityValue: {
    fontSize: fontSizes.sm,
    color: Color.FG_1,
    fontWeight: '500',
  },
});


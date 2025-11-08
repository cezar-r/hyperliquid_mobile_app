import { StyleSheet } from 'react-native';
import Color from '../../../../styles/colors';
import { fontSizes } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';

export const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: Color.BG_1,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.RED,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: Color.RED,
  },
});


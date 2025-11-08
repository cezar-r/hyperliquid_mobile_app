import { StyleSheet } from 'react-native';
import { Color, fontSizes, spacing } from '../../../styles';

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


import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    color: Color.FG_1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginBottom: spacing.xl,
  },
  placeholder: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  placeholderText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginBottom: spacing.sm,
  },
});


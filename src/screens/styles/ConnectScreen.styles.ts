import { StyleSheet, Dimensions } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    color: Color.FG_1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    maxWidth: width * 0.8,
  },
  connectButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonText: {
    fontSize: fontSizes.lg,
    color: Color.BG_2,
    textAlign: 'center',
  },
  footer: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xxl,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: '#ef4444',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});


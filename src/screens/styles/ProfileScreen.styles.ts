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
  section: {
    marginBottom: spacing.lg,
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
  },
  infoTextSmall: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xs,
  },
  placeholder: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    marginBottom: spacing.xl,
  },
  placeholderText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginBottom: spacing.sm,
  },
  disconnectButton: {
    backgroundColor: Color.RED,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
  },
});


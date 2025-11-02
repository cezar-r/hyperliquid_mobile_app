import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding to avoid content being hidden behind sticky button
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
  walletInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingsLabel: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    flex: 1,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Color.FG_3,
    backgroundColor: 'transparent',
  },
  customCheckboxChecked: {
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  copyButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    backgroundColor: Color.BG_3,
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
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0b0f13',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disconnectButton: {
    backgroundColor: Color.RED,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 6,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
});

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
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoHidden: {
    opacity: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 3,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 48,
    color: Color.FG_1,
    textAlign: 'center',
    fontWeight: '200',
    // marginTop: 20
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
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
    borderRadius: 8,
    // minWidth: 200,
    width: "100%",
    // top: 500,
  },
  buttonText: {
    fontSize: fontSizes.lg,
    color: Color.BG_2,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: '#ef4444',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});


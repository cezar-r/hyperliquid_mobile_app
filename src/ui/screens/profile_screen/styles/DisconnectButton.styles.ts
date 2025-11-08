import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
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


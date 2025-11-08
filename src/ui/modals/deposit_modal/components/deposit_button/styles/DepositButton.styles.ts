import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Color.BG_2,
    fontSize: 16,
    fontWeight: '600',
  },
});


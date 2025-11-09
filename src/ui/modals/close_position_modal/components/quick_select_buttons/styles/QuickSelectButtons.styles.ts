import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  quickSelectButtonActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  quickSelectButtonText: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  quickSelectButtonTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


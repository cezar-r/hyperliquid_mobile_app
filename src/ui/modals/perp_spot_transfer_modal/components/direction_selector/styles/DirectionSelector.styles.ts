import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  directionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 4,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionButtonActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_3,
  },
  directionButtonTextActive: {
    color: Color.BG_1,
  },
});


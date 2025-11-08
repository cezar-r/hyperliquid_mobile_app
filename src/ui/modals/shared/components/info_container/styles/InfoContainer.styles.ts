import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  infoContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  infoValue: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  infoValueAccent: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
});


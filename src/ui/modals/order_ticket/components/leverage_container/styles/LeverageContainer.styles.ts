import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    color: Color.FG_3,
  },
  badge: {
    fontSize: 12,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '500',
  },
  slider: {
    marginTop: 4,
    marginBottom: 0,
  },
});


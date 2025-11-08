import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';

export const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 16,
  },
  perpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 16,
  },
  closeAllText: {
    color: Color.RED,
    fontSize: 14,
    fontWeight: '600',
  },
});


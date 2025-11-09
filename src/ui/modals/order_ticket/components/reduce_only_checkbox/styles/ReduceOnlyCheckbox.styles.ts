import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Color.FG_3,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  label: {
    fontSize: 14,
    color: Color.FG_1,
  },
});


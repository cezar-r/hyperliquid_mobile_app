import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonBuy: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  buttonSell: {
    backgroundColor: Color.RED,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  buttonTextBuy: {
    color: Color.FG_2,
  },
  buttonTextSell: {
    color: Color.FG_1,
  },
});


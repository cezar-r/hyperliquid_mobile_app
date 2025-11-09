import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  buttonActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  buttonBuyActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  buttonSellActive: {
    backgroundColor: Color.DARK_RED,
    borderColor: Color.RED,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Color.FG_3,
  },
  buttonTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  buttonTextBuy: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  buttonTextSell: {
    color: Color.RED,
    fontWeight: '600',
  },
});


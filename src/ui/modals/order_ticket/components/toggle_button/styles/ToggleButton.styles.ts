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
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  buttonBuyActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  buttonSellActive: {
    backgroundColor: Color.RED,
    borderColor: Color.RED,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Color.FG_3,
  },
  buttonTextActive: {
    color: Color.FG_2,
    fontWeight: '600',
  },
  buttonTextBuy: {
    color: Color.FG_2,
    fontWeight: '600',
  },
  buttonTextSell: {
    color: Color.FG_2,
    fontWeight: '600',
  },
});


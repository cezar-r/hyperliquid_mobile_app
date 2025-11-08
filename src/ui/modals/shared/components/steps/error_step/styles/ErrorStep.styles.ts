import { StyleSheet } from 'react-native';
import { Color } from '../../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  errorStep: {
    alignItems: 'center',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Color.DARK_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 32,
    color: Color.RED,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
  errorMessage: {
    backgroundColor: Color.DARK_RED,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: Color.RED,
    fontSize: 14,
  },
});


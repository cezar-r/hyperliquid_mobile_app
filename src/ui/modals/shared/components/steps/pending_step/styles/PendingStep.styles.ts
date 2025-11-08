import { StyleSheet } from 'react-native';
import { Color } from '../../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  pendingStep: {
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 14,
    color: Color.FG_3,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  txLink: {
    color: Color.BRIGHT_ACCENT,
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  infoBox: {
    width: '100%',
    backgroundColor: Color.DARK_ACCENT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: Color.FG_3,
    lineHeight: 18,
  },
  helpText: {
    fontSize: 12,
    color: Color.FG_3,
    textAlign: 'center',
    lineHeight: 16,
  },
});


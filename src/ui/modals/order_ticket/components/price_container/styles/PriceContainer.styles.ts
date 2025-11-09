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
  input: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: Color.FG_1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  useMarketButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Color.BG_3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  useMarketButtonText: {
    color: Color.BRIGHT_ACCENT,
    fontSize: 13,
    fontWeight: '500',
  },
});


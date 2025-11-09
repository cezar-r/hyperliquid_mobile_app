import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageInput: {
    flex: 1,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Color.FG_1,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  percentageSymbol: {
    fontSize: 16,
    color: Color.FG_3,
    marginLeft: 8,
    fontWeight: '600',
  },
});


import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 8,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Color.FG_1,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  maxButton: {
    marginLeft: 8,
    backgroundColor: Color.ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  maxButtonText: {
    color: Color.BRIGHT_ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },
});


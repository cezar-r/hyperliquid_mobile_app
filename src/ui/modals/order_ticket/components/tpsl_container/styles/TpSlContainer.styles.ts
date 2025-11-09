import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: Color.FG_3,
    fontWeight: '600',
    transform: [{ rotate: '90deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '-90deg' }],
  },
  inputGroup: {
    marginBottom: 12,
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
  input: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: Color.FG_1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  inputInvalid: {
    borderColor: Color.RED,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  percentGain: {
    color: Color.BRIGHT_ACCENT,
  },
  percentLoss: {
    color: Color.RED,
  },
  validationError: {
    fontSize: 12,
    color: Color.RED,
    marginTop: 4,
    fontStyle: 'italic',
  },
});


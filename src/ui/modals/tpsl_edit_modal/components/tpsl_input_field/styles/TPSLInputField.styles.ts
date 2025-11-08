import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  percentBadgeContainer: {
    minWidth: 80,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: Color.FG_1,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
});


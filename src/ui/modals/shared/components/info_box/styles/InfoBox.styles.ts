import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  infoBox: {
    borderRadius: 8,
    padding: 12,
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
  feeBox: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginBottom: 8,
  },
  feeBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 8,
  },
  feeBoxText: {
    fontSize: 13,
    color: Color.FG_3,
    lineHeight: 18,
  },
});


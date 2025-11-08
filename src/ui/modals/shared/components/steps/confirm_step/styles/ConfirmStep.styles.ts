import { StyleSheet } from 'react-native';
import { Color } from '../../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  confirmStep: {
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginTop: 20,
    marginBottom: 16,
  },
  confirmationDetails: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  detailValue: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: 16,
  },
});


import { StyleSheet } from 'react-native';
import { Color } from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Color.FG_1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: Color.FG_3,
    fontWeight: '300',
  },
});


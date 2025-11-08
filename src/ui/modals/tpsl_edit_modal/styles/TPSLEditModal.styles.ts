import { StyleSheet, Dimensions } from 'react-native';
import { Color } from '../../../shared/styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Color.BG_2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalBody: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  errorContainer: {
    backgroundColor: Color.MAROON,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Color.FG_1,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Color.FG_1,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: Color.BG_2,
    fontWeight: '600',
  },
});


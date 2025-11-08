import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Color.BG_2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  content: {
    paddingBottom: 20,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 12,
    color: Color.RED,
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoBoxText: {
    fontSize: 13,
    color: Color.FG_2,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Color.BG_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.FG_3,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Color.BRIGHT_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.BG_1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});


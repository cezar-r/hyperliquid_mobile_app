import { StyleSheet } from 'react-native';
import { Color } from '../../styles/colors';

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: Color.FG_3,
    lineHeight: 32,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 20,
    lineHeight: 20,
  },
  directionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 4,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionButtonActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_3,
  },
  directionButtonTextActive: {
    color: Color.BG_1,
  },
  balancesContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: Color.FG_1,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_3,
  },
  balanceValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Color.BRIGHT_ACCENT,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_3,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    borderWidth: 1,
    // borderColor: Color.BG_4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Color.FG_1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  maxButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    // backgroundColor: Color.BG_4,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Color.BRIGHT_ACCENT,
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
  confirmSection: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_1,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.FG_1,
    marginTop: 16,
    textAlign: 'center',
  },
  statusHint: {
    fontSize: 14,
    color: Color.FG_3,
    marginTop: 8,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 48,
    color: Color.RED,
    fontWeight: '700',
  },
});


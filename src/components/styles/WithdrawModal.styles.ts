import { StyleSheet } from 'react-native';
import { Color } from '../../styles/colors';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Color.BG_1,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
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
  modalBody: {
    padding: 20,
  },
  scrollView: {
    maxHeight: 500,
  },
  
  // Form Step
  formStep: {
  },
  environmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.BG_3,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  envLabel: {
    fontSize: 14,
    color: Color.FG_3,
    marginRight: 8,
  },
  envValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  envMainnet: {
    color: Color.BRIGHT_ACCENT,
  },
  envTestnet: {
    color: Color.PINK,
  },
  walletInfo: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  infoValue: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  balanceRow: {
    marginBottom: 0,
  },
  balanceValue: {
    fontSize: 14,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  addressText: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
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
  infoBox: {
    backgroundColor: Color.DARK_ACCENT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.ACCENT,
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
    backgroundColor: Color.DARK_ACCENT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.ACCENT,
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
  warningBox: {
    backgroundColor: Color.DARK_RED,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: Color.PINK,
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: '700',
  },
  errorMessage: {
    backgroundColor: Color.DARK_RED,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Color.RED,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Color.BG_2,
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: Color.FG_3,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Confirm Step
  confirmStep: {
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  secondaryButtonText: {
    color: Color.FG_1,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonFlex: {
    flex: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Pending Step
  pendingStep: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 14,
    color: Color.FG_3,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Success Step
  successStep: {
    alignItems: 'center',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Color.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
    color: Color.BRIGHT_ACCENT,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: Color.FG_3,
    textAlign: 'center',
    marginBottom: 16,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  
  // Error Step
  errorStep: {
    alignItems: 'center',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Color.DARK_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 32,
    color: Color.RED,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
});


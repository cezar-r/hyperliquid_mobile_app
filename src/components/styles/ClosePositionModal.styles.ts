import { StyleSheet, Dimensions } from 'react-native';
import { Color } from '../../styles/colors';

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
  positionInfo: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
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
  lastInfoRow: {
    marginBottom: 0,
  },
  
  // Slider Section
  sliderSection: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 12,
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageInput: {
    flex: 1,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Color.FG_1,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  percentageSymbol: {
    fontSize: 16,
    color: Color.FG_3,
    marginLeft: 8,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: Color.BG_3,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  quickSelectButtonActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  quickSelectButtonText: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
  },
  quickSelectButtonTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  
  // Amount Display
  amountDisplay: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
  loadingGif: {
    width: 100,
    height: 100,
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


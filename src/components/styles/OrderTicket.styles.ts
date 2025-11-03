import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: "#0b0f13",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6
  },
  closeButtonText: {
    color: Color.FG_1,
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: Color.FG_1,
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Side Selector
  sideSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sideButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  sideButtonBuy: {
    backgroundColor: Color.BG_3,
    borderColor: Color.BG_3,
  },
  sideButtonBuyActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  sideButtonSell: {
    backgroundColor: Color.BG_3,
    borderColor: Color.BG_3,
  },
  sideButtonSellActive: {
    backgroundColor: Color.DARK_RED,
    borderColor: Color.RED,
  },
  sideButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Color.FG_3,
  },
  sideButtonTextBuy: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  sideButtonTextSell: {
    color: Color.RED,
    fontWeight: '600',
  },
  
  // Order Type Selector
  orderTypeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  typeButtonActive: {
    backgroundColor: Color.ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  typeButtonText: {
    fontSize: 15,
    color: Color.FG_3,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabelText: {
    fontSize: 12,
    color: Color.FG_3,
  },
  inputLabelBadge: {
    fontSize: 12,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: Color.FG_1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  textInputDisabled: {
    opacity: 0.5,
  },
  textInputInvalid: {
    borderColor: Color.RED,
  },
  useMarketButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Color.BG_3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  useMarketButtonText: {
    color: Color.BRIGHT_ACCENT,
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Slider
  slider: {
    marginTop: 4,
    marginBottom: 0,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 11,
    color: Color.FG_3,
  },
  
  // Margin Type Selector
  marginTypeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  marginButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  marginButtonActive: {
    backgroundColor: Color.DARK_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  marginButtonText: {
    fontSize: 14,
    color: Color.FG_3,
    fontWeight: '500',
  },
  marginButtonTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  
  // TP/SL Section
  tpslSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
  },
  tpslHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  tpslTitle: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '600',
  },
  tpslChevron: {
    fontSize: 24,
    color: Color.FG_3,
    fontWeight: '600',
    transform: [{ rotate: '90deg' }],
  },
  tpslChevronExpanded: {
    transform: [{ rotate: '-90deg' }],
  },
  tpslInputGroup: {
    marginBottom: 12,
  },
  tpslTextInput: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: Color.FG_1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  tpslTextInputInvalid: {
    borderColor: Color.RED,
  },
  tpslPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  tpslPercentGain: {
    color: Color.BRIGHT_ACCENT,
  },
  tpslPercentLoss: {
    color: Color.RED,
  },
  validationError: {
    fontSize: 12,
    color: Color.RED,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Advanced Options
  advancedOptions: {
    marginBottom: 20,
  },
  tifSelector: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    color: Color.FG_3,
    marginBottom: 8,
  },
  picker: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    color: Color.FG_1,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Color.FG_3,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  checkboxText: {
    fontSize: 14,
    color: Color.FG_1,
  },
  
  // Order Summary
  orderSummary: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryRowLast: {
    marginBottom: 0,
  },
  summaryRowInfo: {
    paddingLeft: 10,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  summaryValue: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '600',
  },
  summaryValueMuted: {
    color: Color.FG_3,
    fontWeight: '500',
  },
  
  // Error Message
  errorMessage: {
    backgroundColor: Color.DARK_RED,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Color.RED,
  },
  errorText: {
    color: Color.RED,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Submit Button
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitButtonBuy: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  submitButtonSell: {
    backgroundColor: Color.RED,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Color.FG_1,
  },
  
  // Confirmation Modal
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: Color.BG_1,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Color.FG_1,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  detailValue: {
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
  },
  detailValueBuy: {
    color: Color.BRIGHT_ACCENT,
  },
  detailValueSell: {
    color: Color.RED,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Color.FG_1,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonBuy: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  confirmButtonSell: {
    backgroundColor: Color.RED,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 16,
    color: Color.FG_1,
    fontWeight: '700',
  },
});


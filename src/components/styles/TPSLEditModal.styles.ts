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
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },

  // Position Info
  positionInfo: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
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

  // Input Group
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

  // Error
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

  // Buttons
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

  // Confirm Step
  confirmContainer: {
    flex: 1,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmDetails: {
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
  },
  confirmNote: {
    fontSize: 12,
    color: Color.FG_3,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Status Steps
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Color.FG_1,
    marginTop: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: Color.FG_3,
    textAlign: 'center',
    lineHeight: 22,
  },
  successIcon: {
    fontSize: 60,
    color: Color.BRIGHT_ACCENT,
  },
  errorIcon: {
    fontSize: 60,
    color: Color.RED,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: Color.BG_2,
    fontWeight: '600',
  },
});


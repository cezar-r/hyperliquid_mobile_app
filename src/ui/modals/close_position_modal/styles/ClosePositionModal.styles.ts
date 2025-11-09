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
  scrollView: {
    maxHeight: 500,
  },
  modalBody: {
    padding: 20,
  },
  
  // Form Step
  formStep: {
  },
  sliderSection: {
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
});


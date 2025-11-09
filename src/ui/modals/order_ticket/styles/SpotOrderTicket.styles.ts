import { StyleSheet } from 'react-native';

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
    paddingTop: 28,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  advancedOptions: {
    marginBottom: 20,
  },
});


import { StyleSheet } from 'react-native';

export const positionCellStyles = StyleSheet.create({
  cellWrapper: {
    position: 'relative',
  },
  sparklineOverlay: {
    position: 'absolute',
    top: 0,
    left: '35%',
    right: '35%',
    bottom: 1, // Account for separator
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.4,
    marginLeft: 25,
    marginRight: -10,
  },
});

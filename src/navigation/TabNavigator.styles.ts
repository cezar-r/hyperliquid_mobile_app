import { StyleSheet } from 'react-native';
import Color from '../styles/colors';

export const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingTop: 4,
  },
  activeLine: {
    position: 'absolute',
    top: -4,
    width: '150%',
    height: 3,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: 3,
  },
});


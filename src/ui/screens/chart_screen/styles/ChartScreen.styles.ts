import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
    paddingTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  separator: {
    height: 1,
    backgroundColor: Color.BG_3,
  },
});


import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';

export const styles = StyleSheet.create({
  sortHeaderContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  sortScrollContent: {
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    marginRight: 4,
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: Color.BG_1,
    marginBottom: 16,
  },
  sortButtonActive: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  sortButtonText: {
    color: Color.FG_1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortButtonTextActive: {
    color: Color.BG_2,
    fontWeight: '600',
  },
  sortIcon: {
    marginLeft: 4,
  },
});


import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';

export const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.DARK_ACCENT,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Color.FG_1,
    fontSize: 16,
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
  },
});


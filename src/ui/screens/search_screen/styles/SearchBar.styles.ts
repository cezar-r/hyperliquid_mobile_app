import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';

export const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#0b0f13",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 5,
    borderColor: Color.BRIGHT_ACCENT,
    borderWidth: 1,
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


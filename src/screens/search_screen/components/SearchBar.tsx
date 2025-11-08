import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Color from '../../../styles/colors';
import { styles } from '../styles/SearchBar.styles';

interface SearchBarProps {
  searchQuery: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export default function SearchBar({
  searchQuery,
  onChangeText,
  onClear,
}: SearchBarProps): React.JSX.Element {
  return (
    <View style={styles.searchBarContainer}>
      <Ionicons
        name="search"
        size={20}
        color={Color.BRIGHT_ACCENT}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={onChangeText}
        placeholder=""
        placeholderTextColor={Color.FG_3}
        keyboardAppearance="dark"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close" size={20} color={Color.BRIGHT_ACCENT} />
        </TouchableOpacity>
      )}
    </View>
  );
}


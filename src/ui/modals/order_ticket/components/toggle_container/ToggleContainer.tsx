import React from 'react';
import { View } from 'react-native';
import { styles } from './styles/ToggleContainer.styles';

interface ToggleContainerProps {
  children: React.ReactNode;
}

export const ToggleContainer: React.FC<ToggleContainerProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};


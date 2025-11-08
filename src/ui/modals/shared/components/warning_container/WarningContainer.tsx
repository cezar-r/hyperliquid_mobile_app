import React from 'react';
import { View } from 'react-native';
import { styles } from './styles/WarningContainer.styles';

interface WarningContainerProps {
  children: React.ReactNode;
}

export const WarningContainer: React.FC<WarningContainerProps> = ({ children }) => {
  return (
    <View style={styles.warningBox}>
      {children}
    </View>
  );
};


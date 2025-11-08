import React from 'react';
import { View } from 'react-native';
import { styles } from './styles/WarningContainer.styles';

interface WarningContainerProps {
  children: React.ReactNode;
  variant?: 'error' | 'info' | 'danger';
}

export const WarningContainer: React.FC<WarningContainerProps> = ({ 
  children,
  variant = 'error'
}) => {
  return (
    <View style={[
      variant === 'error' && styles.errorWarningBox,
      variant === 'info' && styles.infoWarningBox,
      variant === 'danger' && styles.dangerWarningBox
    ]}>
      {children}
    </View>
  );
};


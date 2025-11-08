import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/InfoBox.styles';

interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'fee';
}

export const InfoBox: React.FC<InfoBoxProps> = ({ 
  title, 
  children,
  variant = 'info'
}) => {
  return (
    <View style={variant === 'info' ? styles.infoBox : styles.feeBox}>
      {title && (
        <Text style={variant === 'info' ? styles.infoBoxTitle : styles.feeBoxTitle}>
          {title}
        </Text>
      )}
      {typeof children === 'string' ? (
        <Text style={variant === 'info' ? styles.infoBoxText : styles.feeBoxText}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};


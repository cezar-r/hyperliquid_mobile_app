import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/InfoContainer.styles';

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
  valueStyle?: 'normal' | 'accent';
}

export const InfoRow: React.FC<InfoRowProps> = ({ 
  label, 
  value, 
  isLast = false,
  valueStyle = 'normal'
}) => {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[
        styles.infoValue,
        valueStyle === 'accent' && styles.infoValueAccent
      ]}>
        {value}
      </Text>
    </View>
  );
};

interface InfoContainerProps {
  children: React.ReactNode;
}

export const InfoContainer: React.FC<InfoContainerProps> = ({ children }) => {
  return (
    <View style={styles.infoContainer}>
      {children}
    </View>
  );
};


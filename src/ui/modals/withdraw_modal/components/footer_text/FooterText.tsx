import React from 'react';
import { Text } from 'react-native';
import { styles } from './styles/FooterText.styles';

interface FooterTextProps {
  text: string;
}

export const FooterText: React.FC<FooterTextProps> = ({ text }) => {
  return (
    <Text style={styles.helpText}>{text}</Text>
  );
};


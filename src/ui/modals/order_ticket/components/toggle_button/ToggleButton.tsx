import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles/ToggleButton.styles';

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  variant?: 'default' | 'buy' | 'sell';
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ 
  label, 
  isActive, 
  onPress,
  variant = 'default'
}) => {
  const getButtonStyle = () => {
    if (!isActive) return styles.button;
    
    switch (variant) {
      case 'buy':
        return [styles.button, styles.buttonBuyActive];
      case 'sell':
        return [styles.button, styles.buttonSellActive];
      default:
        return [styles.button, styles.buttonActive];
    }
  };
  
  const getTextStyle = () => {
    if (!isActive) return styles.buttonText;
    
    switch (variant) {
      case 'buy':
        return [styles.buttonText, styles.buttonTextBuy];
      case 'sell':
        return [styles.buttonText, styles.buttonTextSell];
      default:
        return [styles.buttonText, styles.buttonTextActive];
    }
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
    >
      <Text style={getTextStyle()}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};


import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/BuySellButtons.styles';

interface BuySellButtonsProps {
  onBuyPress: () => void;
  onSellPress: () => void;
}

export default function BuySellButtons({
  onBuyPress,
  onSellPress,
}: BuySellButtonsProps): React.JSX.Element {
  return (
    <View style={styles.orderButtonsContainer}>
      <TouchableOpacity
        style={[styles.orderButton, styles.orderButtonBuy]}
        onPress={onBuyPress}
        activeOpacity={0.8}
      >
        <Text style={styles.orderButtonTextBuy}>BUY</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.orderButton, styles.orderButtonSell]}
        onPress={onSellPress}
        activeOpacity={0.8}
      >
        <Text style={styles.orderButtonTextSell}>SELL</Text>
      </TouchableOpacity>
    </View>
  );
}



import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './styles/PriceContainer.styles';
import Color from '../../../../shared/styles/colors';
import { formatWithCommas } from '../../../../../lib/formatting';

interface PriceContainerProps {
  coin: string;
  price: string;
  onPriceChange: (price: string) => void;
  currentPrice?: string;
  orderType: 'limit' | 'market';
  onUseMarket?: () => void;
}

export const PriceContainer: React.FC<PriceContainerProps> = ({
  coin,
  price,
  onPriceChange,
  currentPrice,
  orderType,
  onUseMarket,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{coin} Price (USD)</Text>
        {orderType === 'market' && <Text style={styles.badge}>~Market</Text>}
      </View>
      <TextInput
        style={[styles.input, orderType === 'market' && styles.inputDisabled]}
        value={price}
        onChangeText={onPriceChange}
        placeholder="0.00"
        placeholderTextColor={Color.FG_3}
        keyboardType="decimal-pad"
        editable={orderType !== 'market'}
      />
      {currentPrice && orderType === 'limit' && onUseMarket && (
        <TouchableOpacity
          style={styles.useMarketButton}
          onPress={onUseMarket}
        >
          <Text style={styles.useMarketButtonText}>
            Use Market: ${formatWithCommas(parseFloat(currentPrice), 2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


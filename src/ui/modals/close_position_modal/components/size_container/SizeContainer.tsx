import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/SizeContainer.styles';

interface SizeContainerProps {
  size: string;
  coin: string;
}

export const SizeContainer: React.FC<SizeContainerProps> = ({ size, coin }) => {
  return (
    <View style={styles.amountDisplay}>
      <View style={styles.sizeRow}>
        <Text style={styles.infoLabel}>Size</Text>
        <Text style={styles.infoValue}>
          {size} {coin}
        </Text>
      </View>
    </View>
  );
};


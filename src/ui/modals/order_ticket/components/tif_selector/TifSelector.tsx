import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from './styles/TifSelector.styles';

type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface TifSelectorProps {
  value: TimeInForce;
  onValueChange: (value: TimeInForce) => void;
}

export const TifSelector: React.FC<TifSelectorProps> = ({ value, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time in Force</Text>
      <Picker
        selectedValue={value}
        onValueChange={(val) => onValueChange(val as TimeInForce)}
        style={styles.picker}
      >
        <Picker.Item label="GTC (Good till Cancel)" value="Gtc" />
        <Picker.Item label="IOC (Immediate or Cancel)" value="Ioc" />
        <Picker.Item label="ALO (Add Liquidity Only)" value="Alo" />
      </Picker>
    </View>
  );
};


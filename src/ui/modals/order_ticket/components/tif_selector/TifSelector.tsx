import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/TifSelector.styles';
import { ToggleContainer } from '../toggle_container/ToggleContainer';
import { ToggleButton } from '../toggle_button/ToggleButton';
import { playOrderTicketSelectionChangeHaptic } from '../../../../../lib/haptics';

type TimeInForce = 'Gtc' | 'Ioc' | 'Alo';

interface TifSelectorProps {
  value: TimeInForce;
  onValueChange: (value: TimeInForce) => void;
}

export const TifSelector: React.FC<TifSelectorProps> = ({ value, onValueChange }) => {
  const handleChange = (newValue: TimeInForce) => {
    playOrderTicketSelectionChangeHaptic();
    onValueChange(newValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time in Force</Text>
      <ToggleContainer>
        <ToggleButton
          label="GTC"
          isActive={value === 'Gtc'}
          onPress={() => handleChange('Gtc')}
        />
        <ToggleButton
          label="IOC"
          isActive={value === 'Ioc'}
          onPress={() => handleChange('Ioc')}
        />
        <ToggleButton
          label="ALO"
          isActive={value === 'Alo'}
          onPress={() => handleChange('Alo')}
        />
      </ToggleContainer>
    </View>
  );
};


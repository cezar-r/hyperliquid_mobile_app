import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/ValidatorInfoContainer.styles';

interface ValidatorInfoContainerProps {
  validatorName: string;
  validatorAddress: string;
  variant?: 'delegate' | 'undelegate';
}

export const ValidatorInfoContainer: React.FC<ValidatorInfoContainerProps> = ({
  validatorName,
  validatorAddress,
  variant = 'delegate',
}) => {
  return (
    <View style={[
      styles.validatorCard,
      variant === 'delegate' ? styles.delegateVariant : styles.undelegateVariant
    ]}>
      <Text style={styles.validatorLabel}>Validator</Text>
      <Text style={[
        styles.validatorName,
        variant === 'delegate' ? styles.delegateText : styles.undelegateText
      ]}>
        {validatorName}
      </Text>
      <Text style={styles.validatorAddress}>
        {validatorAddress.slice(0, 10)}...{validatorAddress.slice(-8)}
      </Text>
    </View>
  );
};


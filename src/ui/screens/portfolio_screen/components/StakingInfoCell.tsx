import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/StakingInfoCell.styles';

interface StakingInfoCellProps {
  label: string;
  value: string;
  sublabel?: string;
}

export default function StakingInfoCell({
  label,
  value,
  sublabel,
}: StakingInfoCellProps): React.JSX.Element {
  return (
    <View style={styles.stakingSummaryItem}>
      <Text style={styles.stakingLabel}>{label}</Text>
      <Text style={styles.stakingValue}>{value}</Text>
      {sublabel && <Text style={styles.stakingSubtext}>{sublabel}</Text>}
    </View>
  );
}


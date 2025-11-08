import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles/ConfirmStep.styles';
import { WarningContainer } from '../../warning_container/WarningContainer';
import { ActionButtons } from '../../action_buttons/ActionButtons';

export interface DetailRowData {
  label: string;
  value: string;
  isLast?: boolean;
}

interface ConfirmStepProps {
  title: string;
  details: DetailRowData[];
  warningText?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({
  title,
  details,
  warningText,
  onCancel,
  onConfirm,
  confirmText,
}) => {
  return (
    <View style={styles.confirmStep}>
      <Text style={styles.confirmTitle}>{title}</Text>
      <View style={styles.confirmationDetails}>
        {details.map((detail, index) => (
          <View 
            key={index} 
            style={[
              styles.detailRow, 
              (detail.isLast || index === details.length - 1) && { marginBottom: 0 }
            ]}
          >
            <Text style={styles.detailLabel}>{detail.label}</Text>
            <Text style={styles.detailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>
      {warningText && (
        <WarningContainer>
          {warningText}
        </WarningContainer>
      )}
      <ActionButtons
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmText={confirmText}
      />
    </View>
  );
};


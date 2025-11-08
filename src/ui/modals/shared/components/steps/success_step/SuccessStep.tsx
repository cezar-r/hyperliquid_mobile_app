import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/SuccessStep.styles';

export interface SuccessDetailRowData {
  label: string;
  value: string;
}

interface SuccessStepProps {
  title: string;
  description: string;
  details?: SuccessDetailRowData[];
  infoBox?: {
    title: string;
    text: string;
  };
  txLink?: {
    text: string;
    onPress: () => void;
  };
  onClose: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  title,
  description,
  details,
  infoBox,
  txLink,
  onClose,
}) => {
  return (
    <View style={styles.successStep}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>{title}</Text>
      <Text style={styles.successText}>{description}</Text>
      {details && details.length > 0 && (
        <View style={styles.successDetails}>
          {details.map((detail, index) => (
            <View 
              key={index} 
              style={[
                styles.detailRow, 
                index === details.length - 1 && { marginBottom: 0 }
              ]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
          {txLink && (
            <TouchableOpacity onPress={txLink.onPress}>
              <Text style={styles.txLink}>{txLink.text}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {infoBox && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>{infoBox.title}</Text>
          <Text style={styles.infoBoxText}>{infoBox.text}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
        <Text style={styles.primaryButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};


import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles/PendingStep.styles';
import { LoadingBlob } from '../../../../../shared/components';

interface PendingStepProps {
  title: string;
  description: string;
  infoBox?: {
    title: string;
    text: string;
  };
  txLink?: {
    url: string;
    text: string;
    onPress: () => void;
  };
  footerText?: string;
}

export const PendingStep: React.FC<PendingStepProps> = ({
  title,
  description,
  infoBox,
  txLink,
  footerText,
}) => {
  return (
    <View style={styles.pendingStep}>
      <LoadingBlob />
      <Text style={styles.pendingTitle}>{title}</Text>
      <Text style={styles.pendingText}>{description}</Text>
      {txLink && (
        <TouchableOpacity onPress={txLink.onPress}>
          <Text style={styles.txLink}>{txLink.text}</Text>
        </TouchableOpacity>
      )}
      {infoBox && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>{infoBox.title}</Text>
          <Text style={styles.infoBoxText}>{infoBox.text}</Text>
        </View>
      )}
      {footerText && (
        <Text style={styles.helpText}>{footerText}</Text>
      )}
    </View>
  );
};


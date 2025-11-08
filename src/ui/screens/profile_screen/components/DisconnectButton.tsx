import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/DisconnectButton.styles';

interface DisconnectButtonProps {
  onPress: () => void;
}

export default function DisconnectButton({
  onPress,
}: DisconnectButtonProps): React.JSX.Element {
  return (
    <View style={styles.stickyButtonContainer}>
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}


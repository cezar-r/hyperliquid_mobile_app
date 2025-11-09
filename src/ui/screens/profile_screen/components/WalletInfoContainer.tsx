import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Octicons } from '@expo/vector-icons';
import { Color } from '../../../shared/styles';
import { styles } from '../styles/WalletInfoContainer.styles';
import { playCopyButtonHaptic } from '../../../../lib/haptics';

interface WalletInfoContainerProps {
  address: string | undefined;
}

export default function WalletInfoContainer({
  address,
}: WalletInfoContainerProps): React.JSX.Element {
  const borderOpacity = useRef(new Animated.Value(0)).current;

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (address) {
      playCopyButtonHaptic();
      await Clipboard.setStringAsync(address);
      
      // Animate border: fade in → hold → fade out
      Animated.sequence([
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(borderOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const animatedBorderColor = borderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(109, 202, 190, 0)', Color.BRIGHT_ACCENT],
  });

  return (
    <Animated.View
      style={[
        styles.section,
        {
          borderWidth: 1,
          borderColor: animatedBorderColor,
        },
      ]}
    >
      <View style={styles.walletInfoRow}>
        <Text style={styles.infoText}>
          {formatAddress(address)}
        </Text>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyAddress}
          activeOpacity={0.7}
        >
          <Octicons name="copy" size={16} color={Color.BRIGHT_ACCENT} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}


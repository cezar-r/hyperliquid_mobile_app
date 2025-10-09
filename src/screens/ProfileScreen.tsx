import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './styles/ProfileScreen.styles';

interface ProfileScreenProps {
  onDisconnect: () => void;
}

export default function ProfileScreen({
  onDisconnect,
}: ProfileScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Account settings and preferences
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            • Wallet address
          </Text>
          <Text style={styles.placeholderText}>
            • Network selection
          </Text>
          <Text style={styles.placeholderText}>
            • Preferences
          </Text>
          <Text style={styles.placeholderText}>
            • About & support
          </Text>
        </View>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={onDisconnect}
          activeOpacity={0.8}
        >
          <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


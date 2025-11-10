import React, { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { logScreenMount, logScreenUnmount } from '../../../lib/logger';
import { styles } from './styles/SettingsScreen.styles';
import { SettingsContainer } from '../profile_screen/components';

export default function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('SettingsScreen');
    return () => logScreenUnmount('SettingsScreen');
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
      >
        <SettingsContainer />
      </ScrollView>
    </SafeAreaView>
  );
}


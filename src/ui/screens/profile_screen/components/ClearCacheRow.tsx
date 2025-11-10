import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { clearAllCache, getCacheStats } from '../../../../lib/candleCache';
import { playPrimaryButtonHaptic } from '../../../../lib/haptics';
import { logUserAction } from '../../../../lib/logger';
import { styles } from '../styles/SettingsRow.styles';
import { Color } from '../../../shared/styles';

export default function ClearCacheRow(): React.JSX.Element {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    try {
      playPrimaryButtonHaptic();
      logUserAction('ProfileScreen', 'Clear cache button pressed');
      
      // Get stats before clearing
      const statsBefore = await getCacheStats();
      
      Alert.alert(
        'Clear Cache',
        `This will clear ${statsBefore.totalEntries} cached chart entries. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              setIsClearing(true);
              try {
                await clearAllCache();
                logUserAction('ProfileScreen', 'Cache cleared successfully');
                Alert.alert('Success', 'Cache cleared successfully!');
              } catch (error) {
                console.error('[ProfileScreen] Error clearing cache:', error);
                Alert.alert('Error', 'Failed to clear cache. Please try again.');
              } finally {
                setIsClearing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[ProfileScreen] Error getting cache stats:', error);
      // If we can't get stats, just show a generic message
      Alert.alert(
        'Clear Cache',
        'This will clear all cached chart data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              setIsClearing(true);
              try {
                await clearAllCache();
                logUserAction('ProfileScreen', 'Cache cleared successfully');
                Alert.alert('Success', 'Cache cleared successfully!');
              } catch (error) {
                console.error('[ProfileScreen] Error clearing cache:', error);
                Alert.alert('Error', 'Failed to clear cache. Please try again.');
              } finally {
                setIsClearing(false);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.settingsRow}
      onPress={handleClearCache}
      activeOpacity={0.7}
      disabled={isClearing}
    >
      <Text style={styles.settingsLabel}>Clear Cache</Text>
      {isClearing ? (
        <ActivityIndicator size="small" color={Color.FG_2} />
      ) : (
        <View style={styles.arrowIcon}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}


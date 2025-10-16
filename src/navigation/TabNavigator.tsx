import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import SearchScreen from '../screens/SearchScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Color from '../styles/colors';
import { styles } from './TabNavigator.styles';

export type TabParamList = {
  Home: undefined;
  Portfolio: undefined;
  Search: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICON_SIZE = 27;

function TabIcon({
  iconType,
  iconName,
  focused,
}: {
  iconType: 'MaterialCommunityIcons' | 'MaterialIcons' | 'Ionicons';
  iconName: string;
  focused: boolean;
}): React.JSX.Element {
  const iconColor = focused ? Color.BRIGHT_ACCENT : Color.FG_3;
  
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.activeLine} />}
      {iconType === 'MaterialCommunityIcons' && (
        <MaterialCommunityIcons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
      {iconType === 'MaterialIcons' && (
        <MaterialIcons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
      {iconType === 'Ionicons' && (
        <Ionicons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
    </View>
  );
}

export default function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Color.BG_1,
          borderBottomWidth: 1,
          borderBottomColor: Color.ACCENT,
        },
        headerTitleStyle: {
          color: Color.FG_1,
        },
        tabBarStyle: {
          backgroundColor: Color.BG_2,
          borderTopWidth: 1,
          borderTopColor: Color.BG_1,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Color.BRIGHT_ACCENT,
        tabBarInactiveTintColor: Color.FG_3,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconType="MaterialCommunityIcons" iconName="home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconType="MaterialIcons" iconName="account-balance-wallet" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconType="Ionicons" iconName="search" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconType="MaterialCommunityIcons" iconName="history" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconType="MaterialCommunityIcons" iconName="account" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


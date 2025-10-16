import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import SearchScreen from '../screens/SearchScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Color from '../styles/colors';
import { fontSizes } from '../theme/typography';
import { styles } from './TabNavigator.styles';

export type TabParamList = {
  Home: undefined;
  Portfolio: undefined;
  Search: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({
  label,
  focused,
}: {
  label: string;
  focused: boolean;
}): React.JSX.Element {
  return (
    <Text
      style={[
        styles.iconText,
        { color: focused ? Color.BRIGHT_ACCENT : Color.FG_3 },
      ]}
    >
      {label.charAt(0)}
    </Text>
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
          fontSize: fontSizes.lg,
          color: Color.FG_1,
        },
        tabBarStyle: {
          backgroundColor: Color.BG_1,
          borderTopWidth: 1,
          borderTopColor: Color.ACCENT,
        },
        tabBarActiveTintColor: Color.BRIGHT_ACCENT,
        tabBarInactiveTintColor: Color.FG_3,
        tabBarLabelStyle: {
          fontSize: fontSizes.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="H" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="P" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="S" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="I" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="A" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


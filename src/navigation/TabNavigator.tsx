import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import HomeScreen from '../screens/home_screen/HomeScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import SearchScreen from '../screens/search_screen/SearchScreen';
import HistoryScreen from '../screens/history_screen/HistoryScreen';
import ProfileScreen from '../screens/profile_screen/ProfileScreen';
import Color from '../styles/colors';
import { styles } from './TabNavigator.styles';
import { playNavbarHaptic } from '../lib/haptics';

export type TabParamList = {
  Home: undefined;
  Portfolio: undefined;
  Search: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICON_SIZE = 27;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT = 5;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;

function TabIcon({
  iconType,
  iconName,
  focused,
}: {
  iconType: 'MaterialCommunityIcons' | 'MaterialIcons' | 'Ionicons';
  iconName: string;
  focused: boolean;
}): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [iconColor, setIconColor] = useState(focused ? Color.BRIGHT_ACCENT : Color.FG_3);
  
  useEffect(() => {
    // Compress then expand animation (triggers on both focus and unfocus)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 75,
        useNativeDriver: true,
      }),
    ]).start();

    if (focused) {
      // Delay color change to halfway through animation
      setTimeout(() => {
        setIconColor(Color.BRIGHT_ACCENT);
      }, 38);
    } else {
      // Immediate color change for unfocused
      setIconColor(Color.FG_3);
    }
  }, [focused, scaleAnim]);
  
  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
      {iconType === 'MaterialCommunityIcons' && (
        <MaterialCommunityIcons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
      {iconType === 'MaterialIcons' && (
        <MaterialIcons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
      {iconType === 'Ionicons' && (
        <Ionicons name={iconName as any} size={ICON_SIZE} color={iconColor} />
      )}
    </Animated.View>
  );
}

function SlidingActiveLine(): React.JSX.Element {
  const linePosition = useRef(new Animated.Value(0)).current;
  const tabIndex = useNavigationState(state => state?.index ?? 0);

  useEffect(() => {
    // Animate line to new position
    Animated.timing(linePosition, {
      toValue: tabIndex * TAB_WIDTH,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [tabIndex, linePosition]);

  return (
    <Animated.View
      style={[
        styles.slidingActiveLine,
        {
          transform: [{ translateX: linePosition }],
        },
      ]}
    />
  );
}

export default function TabNavigator(): React.JSX.Element {
  return (
    <>
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
            position: 'relative',
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: Color.BRIGHT_ACCENT,
          tabBarInactiveTintColor: Color.FG_3,
        }}
        tabBar={(props) => {
          const { state, descriptors, navigation } = props;
          return (
            <Animated.View style={styles.tabBarContainer}>
              <SlidingActiveLine />
              <Animated.View style={styles.tabBarContent}>
                {state.routes.map((route, index) => {
                  const { options } = descriptors[route.key];
                  const isFocused = state.index === index;

                  const onPress = () => {
                    // Trigger light haptic feedback
                    playNavbarHaptic();
                    
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  };

                  return (
                    <Animated.View key={route.key} style={styles.tabButton}>
                      <Animated.View
                        style={styles.tabTouchable}
                        onTouchEnd={onPress}
                      >
                        {options.tabBarIcon?.({ focused: isFocused, color: '', size: 0 })}
                      </Animated.View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </Animated.View>
          );
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="MaterialCommunityIcons" iconName="home" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Portfolio"
          component={PortfolioScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="MaterialIcons" iconName="account-balance-wallet" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="Ionicons" iconName="search" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="MaterialCommunityIcons" iconName="history" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="MaterialCommunityIcons" iconName="account" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}


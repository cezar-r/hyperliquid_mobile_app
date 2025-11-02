import { StyleSheet, Dimensions } from 'react-native';
import Color from '../styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT = 5;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;

export const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  activeLine: {
    position: 'absolute',
    top: -4,
    width: '150%',
    height: 3,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: 3,
  },
  tabBarContainer: {
    backgroundColor: Color.BG_2,
    borderTopWidth: 1,
    borderTopColor: Color.BG_1,
    position: 'relative',
    height: 80,
  },
  tabBarContent: {
    flexDirection: 'row',
    height: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 26,
  },
  tabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slidingActiveLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TAB_WIDTH * 0.67,
    height: 3,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: 3,
    marginLeft: TAB_WIDTH * 0.165, // Center the line within the tab
  },
});


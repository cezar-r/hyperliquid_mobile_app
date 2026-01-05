import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';

export const THUMB_SIZE = 24;
export const DOT_SIZE = 8;
export const TRACK_HEIGHT = 4;

export const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sliderArea: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: Color.BG_3,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  trackFilled: {
    height: TRACK_HEIGHT,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    zIndex: 1,
  },
  dotFilled: {
    backgroundColor: Color.BRIGHT_ACCENT,
    borderColor: Color.BRIGHT_ACCENT,
  },
  dotEmpty: {
    backgroundColor: Color.BG_3,
    borderColor: Color.FG_3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: Color.BRIGHT_ACCENT,
    backgroundColor: Color.BG_3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    // Elevation for Android
    elevation: 3,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Color.BG_1,
  },
});

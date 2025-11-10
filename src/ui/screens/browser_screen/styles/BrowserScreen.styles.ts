import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b0f13',
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderColor: Color.BRIGHT_ACCENT,
    borderWidth: 1,
  },
  navButton: {
    padding: 2,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 36,
    color: Color.BRIGHT_ACCENT,
    fontWeight: '300',
    lineHeight: 36,
  },
  urlInput: {
    flex: 1,
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0f13',
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
});


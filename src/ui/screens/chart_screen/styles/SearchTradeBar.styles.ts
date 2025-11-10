import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#0b0f13',
    borderTopWidth: 1,
    borderTopColor: Color.BG_3,
    alignItems: 'center',
    zIndex: 1001,
    justifyContent: 'space-between',
  },
  containerDetailView: {
    paddingBottom: spacing.xl, // Extra padding when tab bar is not visible
  },
  // Collapsed state - search icon button
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Color.BG_2,
    borderWidth: 1,
    borderColor: Color.BRIGHT_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Expanded state - search input
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.BG_2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.BRIGHT_ACCENT,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Color.FG_1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  // Trade / X button
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  tradeButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  tradeButtonDisabled: {
    backgroundColor: Color.BG_3,
    opacity: 0.5,
  },
  closeButton: {
    backgroundColor: Color.BG_2,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  tradeButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Color.FG_2,
    letterSpacing: 0.5,
  },
  tradeButtonTextDisabled: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Color.FG_3,
    letterSpacing: 0.5,
  },
  closeButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Color.FG_1,
    letterSpacing: 0.5,
  },
});


import { StyleSheet } from 'react-native';
import { Color, fontSizes, spacing } from '../../../styles';

export const styles = StyleSheet.create({
  filterContainer: {
    paddingTop: spacing.md,
  },
  panelSelector: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  panelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  panelText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '500',
  },
  panelTextActive: {
    color: Color.FG_1,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    height: 1,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  slidingSeparator: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    height: 1,
    backgroundColor: Color.BRIGHT_ACCENT,
    borderRadius: 3,
  },
});


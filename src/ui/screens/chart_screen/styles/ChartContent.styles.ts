import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

const CHART_CONTAINER_HEIGHT = 436;

export const styles = StyleSheet.create({
  chartFixedContainer: {
    height: CHART_CONTAINER_HEIGHT,
  },
  chartIntervalHeader: {
    flexDirection: 'row',
    backgroundColor: '#0b0f13',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: 0,
  },
  chartIntervalButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: '#161b22',
  },
  chartIntervalText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '400',
  },
  chartIntervalTextActive: {
    color: Color.BRIGHT_ACCENT,
    fontWeight: '600',
  },
  starButton: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#0b0f13',
    borderRadius: 12,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGif: {
    width: 100,
    height: 100,
  },
  errorContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FF4444',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#FF4444',
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 12,
    height: 400,
  },
  emptyState: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    textAlign: 'center',
  },
});


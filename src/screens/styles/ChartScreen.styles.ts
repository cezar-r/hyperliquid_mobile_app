import { StyleSheet } from 'react-native';
import Color from '../../styles/colors';
import { fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    color: Color.FG_1,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginTop: spacing.xs,
  },
  intervalSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  intervalButtonActive: {
    backgroundColor: Color.BG_3,
    borderColor: Color.ACCENT,
  },
  intervalText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    fontWeight: '500',
  },
  intervalTextActive: {
    color: Color.ACCENT,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FF4444',
    marginVertical: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#FF4444',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: Color.BG_3,
    borderRadius: 12,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Color.BG_2,
  },
  infoText: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
});


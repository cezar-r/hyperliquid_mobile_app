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
  title: {
    fontSize: fontSizes.xl,
    color: Color.FG_1,
    marginBottom: spacing.lg,
  },
  addressContainer: {
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  addressLabel: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: fontSizes.md,
    color: Color.ACCENT,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: fontSizes.md,
    color: '#FF6B6B',
  },
  summaryContainer: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    color: Color.FG_1,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Color.BG_3,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
  },
  summaryValue: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  summaryValueHighlight: {
    fontSize: fontSizes.md,
    color: Color.ACCENT,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Color.FG_3,
    opacity: 0.1,
    marginVertical: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    textAlign: 'center',
  },
});


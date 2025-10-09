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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Color.ACCENT,
  },
  toggleButtonText: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: Color.BG_2,
  },
  searchInput: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: Color.FG_1,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  resultsCount: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
    marginBottom: spacing.md,
  },
  marketList: {
    gap: spacing.sm,
  },
  marketItem: {
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  marketItemSelected: {
    borderColor: Color.ACCENT,
    borderWidth: 2,
  },
  marketItemLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  marketName: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  marketBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  marketLeverage: {
    fontSize: fontSizes.xs,
    color: Color.ACCENT,
    backgroundColor: Color.BG_2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  marketChange: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  marketChangePositive: {
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  marketChangeNegative: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  marketItemRight: {
    alignItems: 'flex-end',
  },
  marketPrice: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    fontWeight: '600',
  },
  marketVolume: {
    fontSize: fontSizes.xs,
    color: Color.FG_3,
    marginTop: 2,
  },
  marketPriceLoading: {
    fontSize: fontSizes.md,
    color: Color.FG_3,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Color.FG_2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: Color.FG_3,
  },
});


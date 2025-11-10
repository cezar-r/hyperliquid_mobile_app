import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';
import { fontSizes, spacing } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: 36,
    color: Color.FG_1,
    fontWeight: '300',
    lineHeight: 36,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 48, // Offset for back button to center the title
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    color: Color.FG_1,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});


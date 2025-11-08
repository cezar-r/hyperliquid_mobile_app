import { StyleSheet } from 'react-native';
import Color from '../../../styles/colors';
import { fontSizes } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    backgroundColor: Color.BG_3,
    padding: spacing.md,
    borderRadius: 8,
  },
  walletInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: fontSizes.md,
    color: Color.FG_1,
    flex: 1,
  },
  copyButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.ACCENT,
    backgroundColor: Color.BG_3,
  },
});


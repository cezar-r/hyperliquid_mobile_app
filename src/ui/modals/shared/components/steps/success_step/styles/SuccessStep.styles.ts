import { StyleSheet } from 'react-native';
import { Color } from '../../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  successStep: {
    alignItems: 'center',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Color.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
    color: Color.BRIGHT_ACCENT,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: Color.FG_3,
    textAlign: 'center',
    marginBottom: 16,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Color.BG_3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  detailValue: {
    fontSize: 14,
    color: Color.FG_1,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  txLink: {
    color: Color.BRIGHT_ACCENT,
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 12,
  },
  infoBox: {
    width: '100%',
    backgroundColor: Color.DARK_ACCENT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Color.ACCENT,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.FG_1,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: Color.FG_3,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: Color.BRIGHT_ACCENT,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: Color.BG_2,
    fontSize: 16,
    fontWeight: '600',
  },
});


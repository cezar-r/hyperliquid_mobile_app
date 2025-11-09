import { StyleSheet } from 'react-native';
import Color from '../../../../../shared/styles/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Color.BG_1,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Color.BG_3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Color.FG_1,
    marginBottom: 20,
    textAlign: 'center',
  },
  details: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Color.BG_3,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: Color.FG_3,
  },
  detailValue: {
    fontSize: 15,
    color: Color.FG_1,
    fontWeight: '600',
  },
  detailValueBuy: {
    color: Color.BRIGHT_ACCENT,
  },
  detailValueSell: {
    color: Color.RED,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.BG_3,
    borderWidth: 1,
    borderColor: Color.FG_3,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Color.FG_1,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonBuy: {
    backgroundColor: Color.BRIGHT_ACCENT,
  },
  confirmButtonSell: {
    backgroundColor: Color.RED,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 16,
    color: Color.FG_1,
    fontWeight: '700',
  },
});


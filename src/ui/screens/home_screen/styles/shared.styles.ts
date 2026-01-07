import { StyleSheet } from 'react-native';
import { Color, spacing } from '../../../shared/styles';

export const sharedStyles = StyleSheet.create({
  // Position Cell Container
  positionCell: {
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0f13',
  },
  
  separator: {
    borderBottomColor: Color.BG_1,
    borderBottomWidth: 1,
    width: '100%',
  },
  
  leftSide: {
    flex: 1,
    justifyContent: 'space-between',
    maxWidth: '38%',
  },
  
  rightSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  
  ticker: {
    color: Color.FG_1,
    fontSize: 15,
    fontWeight: '600',
  },
  
  leverage: {
    fontSize: 15,
    marginBottom: 0,
    fontWeight: 'bold',
  },
  
  leverageTypeBadge: {
    fontSize: 10,
    color: Color.BRIGHT_ACCENT,
    backgroundColor: Color.ACCENT,
    borderWidth: 1,
    borderColor: Color.BG_3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  
  size: {
    color: Color.FG_3,
    fontSize: 12,
  },
  
  priceChange: {
    fontSize: 10,
    marginTop: 2,
  },
  
  price: {
    color: Color.FG_1,
    fontSize: 15,
    marginBottom: 0,
    fontWeight: '600',
  },
  
  pnl: {
    fontSize: 12,
  },
});


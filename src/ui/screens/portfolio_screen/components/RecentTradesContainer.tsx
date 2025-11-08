import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/RecentTradesContainer.styles';
import { TradeCard } from '../../../shared/components';
import type { UserFill } from '../../../../types';

interface RecentTradesContainerProps {
  trades: UserFill[];
  displayLimit: number;
  onShowMore: () => void;
  getDisplayCoin: (coin: string) => string;
}

export default function RecentTradesContainer({
  trades,
  displayLimit,
  onShowMore,
  getDisplayCoin,
}: RecentTradesContainerProps): React.JSX.Element {
  if (trades.length === 0) {
    return <></>;
  }

  return (
    <View style={styles.recentTradesContainer}>
      <Text style={styles.sectionLabel}>Recent Trades ({trades.length})</Text>
      {trades.slice(0, displayLimit).map((fill, idx) => {
        const displayCoin = getDisplayCoin(fill.coin);
        return <TradeCard key={`fill-${idx}`} fill={fill} displayCoin={displayCoin} />;
      })}

      {/* Show More Button */}
      {trades.length > displayLimit && (
        <TouchableOpacity style={styles.showMoreButton} onPress={onShowMore}>
          <Text style={styles.showMoreText}>
            Show More (
            {Math.min(
              displayLimit === 10 ? 20 : displayLimit === 20 ? 50 : trades.length,
              trades.length
            )}{' '}
            of {trades.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


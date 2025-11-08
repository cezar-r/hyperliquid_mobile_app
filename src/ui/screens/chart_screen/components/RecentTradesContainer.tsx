import React from 'react';
import { View, Text } from 'react-native';
import { TradeCard } from '../../../shared/components';
import { styles } from '../styles/RecentTradesContainer.styles';
import type { UserFill } from '../../../../types';

interface RecentTradesContainerProps {
  trades: UserFill[];
  getDisplayCoin: (coin: string) => string;
}

export default function RecentTradesContainer({
  trades,
  getDisplayCoin,
}: RecentTradesContainerProps): React.JSX.Element {
  return (
    <View style={styles.recentTradesContainer}>
      <Text style={styles.sectionLabel}>Recent Trades</Text>
      {trades.length > 0 ? (
        trades.slice(0, 10).map((fill, idx) => {
          const displayCoin = getDisplayCoin(fill.coin);
          
          return (
            <TradeCard
              key={`fill-${idx}`}
              fill={fill}
              displayCoin={displayCoin}
            />
          );
        })
      ) : (
        <Text style={styles.subtitle}>No trades for this market type</Text>
      )}
    </View>
  );
}



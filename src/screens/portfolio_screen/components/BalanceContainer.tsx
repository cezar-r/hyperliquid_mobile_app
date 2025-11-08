import React from 'react';
import { View, Animated } from 'react-native';
import { styles } from '../styles/BalanceContainer.styles';
import TradingVolumeDisplay from './TradingVolumeDisplay';
import BalanceAmount from './BalanceAmount';
import BalancePnL from './BalancePnL';
import type { MarketFilter } from './MarketDropdown';

interface BalanceContainerProps {
  totalValue: number;
  totalPnL: number;
  showPnL: boolean;
  timeFilter: string;
  tradingVolume: number | null;
  marketFilter: MarketFilter;
  textColor: Animated.AnimatedInterpolation<string | number>;
}

export default function BalanceContainer({
  totalValue,
  totalPnL,
  showPnL,
  timeFilter,
  tradingVolume,
  marketFilter,
  textColor,
}: BalanceContainerProps): React.JSX.Element {
  return (
    <>
      {/* Trading Volume Display */}
      {tradingVolume !== null && marketFilter !== 'Staking' && (
        <TradingVolumeDisplay volume={tradingVolume} />
      )}

      {/* Portfolio Value */}
      <View
        style={[
          styles.portfolioValueContainer,
          marketFilter === 'Staking' && styles.portfolioValueContainerStaking,
        ]}
      >
        <BalanceAmount amount={totalValue} textColor={textColor} />
        {showPnL && <BalancePnL pnl={totalPnL} timeFilter={timeFilter} />}
      </View>
    </>
  );
}


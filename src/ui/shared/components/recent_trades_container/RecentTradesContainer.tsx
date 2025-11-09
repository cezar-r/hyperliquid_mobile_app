import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import TradeCard from '../trade_card/TradeCard';
import { styles } from './styles/RecentTradesContainer.styles';
import type { UserFill } from '../../../../types';
import { playShowMoreButtonHaptic } from '../../../../lib/haptics';

interface RecentTradesContainerProps {
  trades: UserFill[];
  displayLimit: number;
  onShowMore: () => void;
  getDisplayCoin: (coin: string) => string;
}

const AnimatedTradeCard = ({ fill, displayCoin, index, previousLimit }: { fill: UserFill; displayCoin: string; index: number; previousLimit: number }) => {
  const fadeAnim = useRef(new Animated.Value(index < previousLimit ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(index < previousLimit ? 0 : 15)).current;

  useEffect(() => {
    // Only animate if this is a new item (index >= previousLimit)
    if (index >= previousLimit) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []); // Empty deps - only run once on mount

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <TradeCard fill={fill} displayCoin={displayCoin} />
    </Animated.View>
  );
};

export default function RecentTradesContainer({
  trades,
  displayLimit,
  onShowMore,
  getDisplayCoin,
}: RecentTradesContainerProps): React.JSX.Element {
  const prevLimitRef = useRef(displayLimit);
  const previousLimit = prevLimitRef.current;

  useEffect(() => {
    // Update ref after render completes
    prevLimitRef.current = displayLimit;
  }, [displayLimit]);

  if (trades.length === 0) {
    return <></>;
  }

  const showingAll = displayLimit >= trades.length;

  return (
    <View style={styles.recentTradesContainer}>
      <Text style={styles.sectionLabel}>Recent Trades ({trades.length})</Text>
      {trades.slice(0, displayLimit).map((fill, idx) => {
        const displayCoin = getDisplayCoin(fill.coin);
        // Use tid if available, otherwise use time + index for unique key
        const key = fill.tid ? `fill-${fill.tid}` : `fill-${fill.time}-${idx}`;
        return <AnimatedTradeCard key={key} fill={fill} displayCoin={displayCoin} index={idx} previousLimit={previousLimit} />;
      })}

      {/* Show More/Less Button */}
      {trades.length > 10 && (
        <TouchableOpacity style={styles.showMoreButton} onPress={() => {
          playShowMoreButtonHaptic();
          onShowMore();
        }}>
          <Text style={styles.showMoreText}>
            {showingAll ? (
              'Show Less'
            ) : (
              <>
                Show More (
                {Math.min(
                  displayLimit === 10 ? 20 : displayLimit === 20 ? 50 : trades.length,
                  trades.length
                )}{' '}
                of {trades.length})
              </>
            )}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


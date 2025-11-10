import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { FlatList } from 'react-native';
import TradeCard from '../trade_card/TradeCard';
import type { UserFill } from '../../../../types';

interface VirtualizedTradesListProps {
  trades: UserFill[];
  visibleCount?: number;
  getDisplayCoin: (coin: string) => string;
  style?: any;
  contentContainerStyle?: any;
  scrollEnabled?: boolean;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  ListEmptyComponent?: React.ReactElement;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

const VirtualizedTradesList = forwardRef<FlatList<UserFill>, VirtualizedTradesListProps>(
  (
    {
      trades,
      visibleCount,
      getDisplayCoin,
      style,
      contentContainerStyle,
      scrollEnabled = true,
      initialNumToRender = 12,
      maxToRenderPerBatch = 12,
      updateCellsBatchingPeriod = 16,
      windowSize = 7,
      removeClippedSubviews = true,
      ListEmptyComponent,
      onEndReached,
      onEndReachedThreshold = 0.5,
    },
    ref
  ): React.JSX.Element => {
    const data = useMemo(() => {
      const count = typeof visibleCount === 'number' ? visibleCount : trades.length;
      return trades.slice(0, Math.min(count, trades.length));
    }, [trades, visibleCount]);

    const zeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000';

    const listRef = useRef<FlatList<UserFill>>(null);
    useImperativeHandle(ref, () => listRef.current as FlatList<UserFill>);

    return (
      <FlatList
        ref={listRef}
        style={style}
        contentContainerStyle={contentContainerStyle}
        data={data}
        keyExtractor={(fill, index) => {
          const hasValidHash = !!fill.hash && fill.hash !== zeroHash;
          const base = hasValidHash
            ? `h-${fill.hash}`
            : `t-${fill.time}-${fill.coin}-${fill.px}-${fill.sz}-${fill.side}`;
          const tidPart = typeof fill.tid === 'number' ? `-${fill.tid}` : '';
          return `${base}${tidPart}-${index}`;
        }}
        renderItem={({ item }) => (
          <TradeCard fill={item} displayCoin={getDisplayCoin(item.coin)} />
        )}
        scrollEnabled={scrollEnabled}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
        windowSize={windowSize}
        removeClippedSubviews={removeClippedSubviews}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListEmptyComponent={ListEmptyComponent}
      />
    );
  }
);

export default VirtualizedTradesList;



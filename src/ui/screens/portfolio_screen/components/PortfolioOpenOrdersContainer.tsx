import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles/PortfolioOpenOrdersContainer.styles';
import { playTextButtonHaptic } from '../../../../lib/haptics';

interface OpenOrder {
  coin: string;
  oid: number;
  side: string;
  limitPx: string;
  sz: string;
  dex?: string;
}

interface PortfolioOpenOrdersContainerProps {
  orders: OpenOrder[];
  getDisplayName: (coin: string) => string;
  getOrderMarketType: (coin: string, dex?: string) => 'perp' | 'spot' | null;
  onCancelAll: () => void;
  onCancelOrder: (order: OpenOrder, orderMarketType: 'perp' | 'spot' | null) => void;
}

export default function PortfolioOpenOrdersContainer({
  orders,
  getDisplayName,
  getOrderMarketType,
  onCancelAll,
  onCancelOrder,
}: PortfolioOpenOrdersContainerProps): React.JSX.Element {
  if (orders.length === 0) {
    return <></>;
  }

  return (
    <View style={styles.positionsContainer}>
      <View style={styles.ordersHeaderRow}>
        <Text style={styles.sectionLabel}>Open Orders ({orders.length})</Text>
        <TouchableOpacity onPress={() => {
          playTextButtonHaptic();
          onCancelAll();
        }}>
          <Text style={styles.cancelAllText}>Cancel All</Text>
        </TouchableOpacity>
      </View>
      {orders.slice(0, 10).map((order, idx) => {
        const orderMarketType = getOrderMarketType(order.coin, order.dex);
        const displayName = getDisplayName(order.coin);

        return (
          <View key={`order-${idx}-${order.oid}`}>
            <View style={styles.orderCard}>
              <TouchableOpacity
                style={styles.orderLeftSide}
                onPress={() => {
                  // Navigation is handled in the parent component
                }}
              >
                <View style={styles.orderCoinContainer}>
                  <Text style={styles.orderCoin}>{displayName}</Text>
                  <Text
                    style={[
                      styles.orderSide,
                      order.side === 'B' ? styles.sideBuy : styles.sideSell,
                    ]}
                  >
                    {order.side === 'B' ? 'BUY' : 'SELL'}
                  </Text>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderPrice}>${order.limitPx}</Text>
                  <Text style={styles.orderSize}>{order.sz}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.orderRightSide}>
                <TouchableOpacity
                  style={styles.cancelOrderButton}
                  onPress={() => onCancelOrder(order, orderMarketType)}
                >
                  <Text style={styles.cancelOrderButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cellSeparator} />
          </View>
        );
      })}
    </View>
  );
}


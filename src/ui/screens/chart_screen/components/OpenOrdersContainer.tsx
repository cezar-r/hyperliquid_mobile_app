import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/OpenOrdersContainer.styles';

interface OpenOrder {
  coin: string;
  oid: number;
  side: string;
  limitPx: string;
  sz: string;
}

interface OpenOrdersContainerProps {
  orders: OpenOrder[];
  getDisplayName: (coin: string) => string;
  onCancelOrder: (coin: string, oid: number) => void;
  cancelingOrder: number | null;
}

export default function OpenOrdersContainer({
  orders,
  getDisplayName,
  onCancelOrder,
  cancelingOrder,
}: OpenOrdersContainerProps): React.JSX.Element {
  if (orders.length === 0) {
    return <></>;
  }

  return (
    <View style={styles.openOrdersContainer}>
      <Text style={styles.sectionLabel}>
        Open Orders ({orders.length})
      </Text>
      {orders.map((order) => {
        const displayName = getDisplayName(order.coin);
        
        return (
          <View key={`order-${order.oid}`}>
            <View style={styles.orderCard}>
              <View style={styles.orderLeftSide}>
                <View style={styles.orderCoinContainer}>
                  <Text style={styles.orderCoin}>{displayName}</Text>
                  <Text style={[
                    styles.orderSide,
                    order.side === 'B' ? styles.sideBuy : styles.sideSell
                  ]}>
                    {order.side === 'B' ? 'BUY' : 'SELL'}
                  </Text>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderPrice}>${order.limitPx}</Text>
                  <Text style={styles.orderSize}>{order.sz}</Text>
                </View>
              </View>
              <View style={styles.orderRightSide}>
                <TouchableOpacity
                  style={styles.cancelOrderButton}
                  onPress={() => onCancelOrder(order.coin, order.oid)}
                  disabled={cancelingOrder === order.oid}
                >
                  <Text style={styles.cancelOrderButtonText}>
                    {cancelingOrder === order.oid ? 'Canceling...' : 'Cancel'}
                  </Text>
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



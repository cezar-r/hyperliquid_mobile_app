import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './styles/ConfirmationModal.styles';
import Color from '../../../../shared/styles/colors';
import { formatWithCommas } from '../../../../../lib/formatting';

interface OrderDetails {
  coin: string;
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market';
  price: string;
  tokenSize: string;
  marginRequired?: string;
  positionSize?: string;
  leverage?: number;
  marginType?: 'cross' | 'isolated';
  size?: string;
  cost?: string;
}

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  orderDetails: OrderDetails;
  isSpot?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isSubmitting,
  orderDetails,
  isSpot = false,
}) => {
  const { coin, side, orderType, price, tokenSize, marginRequired, positionSize, leverage, marginType, size, cost } = orderDetails;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>
            {isSpot ? 'Confirm Spot Order' : 'Confirm Order'}
          </Text>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Market:</Text>
              <Text style={styles.detailValue}>{isSpot ? coin : `${coin}-PERP`}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Side:</Text>
              <Text style={[
                styles.detailValue,
                side === 'buy' ? styles.detailValueBuy : styles.detailValueSell
              ]}>
                {side === 'buy' ? (isSpot ? 'BUY' : 'BUY / LONG') : (isSpot ? 'SELL' : 'SELL / SHORT')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{orderType.toUpperCase()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>${formatWithCommas(parseFloat(price), 2)}</Text>
            </View>
            {isSpot ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>
                    {size} {coin.split('/')[0]}
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>{side === 'buy' ? 'Total Cost:' : 'Total Proceeds:'}</Text>
                  <Text style={styles.detailValue}>${formatWithCommas(parseFloat(cost || '0'), 2)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Token Size:</Text>
                  <Text style={styles.detailValue}>{tokenSize} {coin}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Margin Required:</Text>
                  <Text style={styles.detailValue}>${formatWithCommas(parseFloat(marginRequired || '0'), 2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Position Size:</Text>
                  <Text style={styles.detailValue}>${formatWithCommas(parseFloat(positionSize || '0'), 2)}</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Leverage:</Text>
                  <Text style={styles.detailValue}>{leverage}x {marginType}</Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                side === 'buy' ? styles.confirmButtonBuy : styles.confirmButtonSell,
                isSubmitting && styles.confirmButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Color.FG_1} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};


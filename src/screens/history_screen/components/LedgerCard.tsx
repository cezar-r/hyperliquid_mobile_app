import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/LedgerCard.styles';
import type { LedgerUpdate } from '../../../types';

interface LedgerCardProps {
  update: LedgerUpdate;
  userAddress?: string;
}

// Helper to format dollar amounts with commas and 2 decimals
function formatDollarAmount(amount: string): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) {
    return '0.00';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function LedgerCard({ update, userAddress }: LedgerCardProps): React.JSX.Element {
  const { delta } = update;

  const renderContent = () => {
    switch (delta.type) {
      case 'deposit':
        return (
          <>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideBuy]}>DEPOSIT</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                +{formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>From Arbitrum</Text>
          </>
        );

      case 'withdraw':
        return (
          <>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideSell]}>WITHDRAWAL</Text>
              <Text style={[styles.tradePnl, styles.pnlNegative]}>
                -{formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              To Arbitrum (Fee: {formatDollarAmount(delta.fee)} USDC)
            </Text>
          </>
        );

      case 'accountClassTransfer':
        return (
          <>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {delta.toPerp ? 'Spot → Perp' : 'Perp → Spot'}
            </Text>
          </>
        );

      case 'spotTransfer':
        return (
          <>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>SPOT TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.amount)} {delta.token}
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {userAddress?.toLowerCase() === delta.user.toLowerCase()
                ? `To ${truncateAddress(delta.destination)}`
                : `From ${truncateAddress(delta.user)}`}
            </Text>
          </>
        );

      case 'internalTransfer':
        return (
          <>
            <View style={styles.tradeTopRow}>
              <Text style={[styles.tradeSide, styles.sideTransfer]}>INTERNAL TRANSFER</Text>
              <Text style={[styles.tradePnl, styles.pnlPositive]}>
                {formatDollarAmount(delta.usdc)} USDC
              </Text>
            </View>
            <Text style={styles.ledgerDetails}>
              {userAddress?.toLowerCase() === delta.user.toLowerCase()
                ? `To ${truncateAddress(delta.destination)}`
                : `From ${truncateAddress(delta.user)}`}
            </Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View>
      <View style={styles.tradeCard}>
        <View style={styles.tradeLeftSide}>
          {renderContent()}
          <Text style={styles.tradeTime}>{formatDate(update.time)}</Text>
        </View>
      </View>
      <View style={styles.cellSeparator} />
    </View>
  );
}


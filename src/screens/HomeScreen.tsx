import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { styles } from './styles/HomeScreen.styles';

export default function HomeScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account } = useWallet();
  const { state: wsState } = useWebSocket();

  const nonZeroSpotBalances =
    account.data?.spotBalances.filter(
      (b) => parseFloat(b.total) > 0
    ).length || 0;

  const selectedCoinPrice = wsState.selectedCoin
    ? wsState.prices[wsState.selectedCoin]
    : null;

  const totalMarkets =
    wsState.marketType === 'perp'
      ? wsState.perpMarkets.length
      : wsState.spotMarkets.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Home</Text>

        {wsState.isConnected && (
          <View style={styles.wsStatusContainer}>
            <View style={styles.wsStatusDot} />
            <Text style={styles.wsStatusText}>Live Data Connected</Text>
          </View>
        )}

        {!wsState.isConnected && wsState.error && (
          <View style={styles.wsErrorContainer}>
            <Text style={styles.wsErrorText}>⚠️ {wsState.error}</Text>
          </View>
        )}

        {address && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Connected Wallet</Text>
            <Text style={styles.addressText}>
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </Text>
          </View>
        )}

        {wsState.selectedCoin && (
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.coinName}>{wsState.selectedCoin}</Text>
              <Text style={styles.marketTypeBadge}>
                {wsState.marketType.toUpperCase()}
              </Text>
            </View>
            {selectedCoinPrice ? (
              <Text style={styles.priceValue}>${selectedCoinPrice}</Text>
            ) : (
              <Text style={styles.priceLoading}>Loading price...</Text>
            )}
            <Text style={styles.priceSubtext}>
              {totalMarkets} {wsState.marketType} markets available
            </Text>
          </View>
        )}

        {account.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FF94" />
            <Text style={styles.loadingText}>Loading account data...</Text>
          </View>
        )}

        {account.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {account.error}</Text>
          </View>
        )}

        {!account.isLoading && !account.error && account.data && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Account Summary</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Perp Positions</Text>
                <Text style={styles.summaryValue}>
                  {account.data.perpPositions.length}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Spot Balances</Text>
                <Text style={styles.summaryValue}>
                  {nonZeroSpotBalances}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Open Orders</Text>
                <Text style={styles.summaryValue}>
                  {account.data.openOrders.length}
                </Text>
              </View>
            </View>

            {account.data.perpMarginSummary.accountValue && (
              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>Margin Summary</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Account Value</Text>
                  <Text style={styles.summaryValueHighlight}>
                    ${parseFloat(
                      account.data.perpMarginSummary.accountValue
                    ).toFixed(2)}
                  </Text>
                </View>

                {account.data.perpMarginSummary.withdrawable && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Withdrawable</Text>
                      <Text style={styles.summaryValue}>
                        ${parseFloat(
                          account.data.perpMarginSummary.withdrawable
                        ).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {!account.isLoading && !account.error && !account.data && address && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No account data available yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Data will appear after connecting your wallet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


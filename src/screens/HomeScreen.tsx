import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatPrice, formatSize } from '../lib/formatting';
import { styles } from './styles/HomeScreen.styles';
import type { PerpPosition } from '../types';

// Helper to calculate PnL for a position
function calculatePositionPnL(position: PerpPosition, currentPrice: string | number): { pnl: number; pnlPercent: number } {
  const positionSize = parseFloat(position.szi);
  const entryPrice = parseFloat(position.entryPx);
  const markPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  
  if (isNaN(positionSize) || isNaN(entryPrice) || isNaN(markPrice)) {
    return { pnl: 0, pnlPercent: 0 };
  }
  
  const pnl = positionSize * (markPrice - entryPrice);
  const pnlPercent = (pnl / (Math.abs(positionSize) * entryPrice)) * 100;
  
  return { pnl, pnlPercent };
}

// Helper to format time ago
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function HomeScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account, exchangeClient, refetchAccount } = useWallet();
  const { state: wsState } = useWebSocket();
  const [closingPosition, setClosingPosition] = useState<string | null>(null);

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

  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    if (!account.data) return null;
    
    const accountValue = account.data.perpMarginSummary.accountValue 
      ? parseFloat(account.data.perpMarginSummary.accountValue)
      : 0;
    
    // Add spot balances value
    let spotValue = 0;
    account.data.spotBalances.forEach(balance => {
      const total = parseFloat(balance.total);
      const price = wsState.prices[balance.coin];
      if (price) {
        spotValue += total * parseFloat(price);
      }
    });
    
    return accountValue + spotValue;
  }, [account.data, wsState.prices]);

  // Calculate total unrealized PnL across all positions
  const totalUnrealizedPnL = useMemo(() => {
    if (!account.data?.perpPositions) return null;
    
    let totalPnL = 0;
    account.data.perpPositions.forEach(position => {
      const price = wsState.prices[position.coin];
      if (price) {
        const { pnl } = calculatePositionPnL(position, price);
        totalPnL += pnl;
      }
    });
    
    return totalPnL;
  }, [account.data?.perpPositions, wsState.prices]);

  // Handle close position
  const handleClosePosition = async (coin: string, size: number) => {
    if (!exchangeClient) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    // Get market info for asset index and szDecimals
    const market = wsState.perpMarkets.find(m => m.name === coin);
    if (!market) {
      Alert.alert('Error', `Asset ${coin} not found in markets`);
      return;
    }
    
    const assetIndex = market.index;
    const szDecimals = market.szDecimals || 4;

    // Get current price
    const currentPrice = parseFloat(wsState.prices[coin] || '0');
    if (!currentPrice) {
      Alert.alert('Error', `No price available for ${coin}`);
      return;
    }

    // Calculate execution price with 0.1% slippage
    let executionPrice: number;
    if (size > 0) {
      // Closing long: SELL at lower price
      executionPrice = currentPrice * 0.999;
    } else {
      // Closing short: BUY at higher price
      executionPrice = currentPrice * 1.001;
    }

    // Show confirmation
    Alert.alert(
      `Close ${coin} Position?`,
      `Size: ${Math.abs(size).toFixed(szDecimals)}\n` +
      `Side: ${size > 0 ? 'Sell (close long)' : 'Buy (close short)'}\n` +
      `Mid Price: $${currentPrice.toFixed(2)}\n` +
      `Execution Price: $${executionPrice.toFixed(2)} (${size > 0 ? '-0.1%' : '+0.1%'} slippage)\n\n` +
      `This will submit a reduce-only market order.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close Position',
          style: 'destructive',
          onPress: async () => {
            setClosingPosition(coin);

            try {
              const formattedPrice = formatPrice(executionPrice, szDecimals, true);
              const formattedSize = formatSize(Math.abs(size), szDecimals, currentPrice);
              
              const orderPayload = {
                orders: [{
                  a: assetIndex,
                  b: size < 0, // If short, buy to close; if long, sell to close
                  p: formattedPrice,
                  s: formattedSize,
                  r: true, // Reduce only
                  t: {
                    limit: { tif: 'Ioc' as const },
                  },
                }],
                grouping: 'na' as const,
              };

              console.log('[HomeScreen] Closing position:', coin);
              console.log('[HomeScreen] Order payload:', JSON.stringify(orderPayload, null, 2));

              const result = await exchangeClient.order(orderPayload);

              console.log('[HomeScreen] ✓ Close order placed:', result);
              Alert.alert('Success', 'Position closing order submitted!');
              
              // Refetch account data
              setTimeout(() => refetchAccount(), 2000);
            } catch (err: any) {
              console.error('[HomeScreen] Failed to close position:', err);
              Alert.alert('Error', `Failed to close position: ${err.message}`);
            } finally {
              setClosingPosition(null);
            }
          },
        },
      ]
    );
  };

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
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Account Summary</Text>
              {account.data.lastUpdated && (
                <Text style={styles.lastUpdated}>
                  {formatTimeAgo(account.data.lastUpdated)}
                </Text>
              )}
            </View>

            {/* Total Portfolio Value */}
            {totalPortfolioValue !== null && totalPortfolioValue > 0 && (
              <View style={styles.portfolioValueCard}>
                <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
                <Text style={styles.portfolioValue}>${totalPortfolioValue.toFixed(2)}</Text>
                {totalUnrealizedPnL !== null && totalUnrealizedPnL !== 0 && (
                  <Text style={[
                    styles.portfolioPnL,
                    totalUnrealizedPnL >= 0 ? styles.pnlPositive : styles.pnlNegative
                  ]}>
                    {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)} uPnL
                  </Text>
                )}
              </View>
            )}

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

            {/* Perp Positions Detail */}
            {account.data.perpPositions.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>Open Positions</Text>
                {account.data.perpPositions.map((position, idx) => {
                  const positionSize = parseFloat(position.szi);
                  const isLong = positionSize > 0;
                  const currentPrice = wsState.prices[position.coin];
                  const { pnl, pnlPercent } = currentPrice 
                    ? calculatePositionPnL(position, currentPrice)
                    : { pnl: 0, pnlPercent: 0 };
                  
                  return (
                    <View key={`position-${idx}`}>
                      {idx > 0 && <View style={styles.summaryDivider} />}
                      <View style={styles.positionItem}>
                        <View style={styles.positionHeader}>
                          <Text style={styles.positionCoin}>{position.coin}</Text>
                          <Text style={[
                            styles.positionDirection,
                            isLong ? styles.directionLong : styles.directionShort
                          ]}>
                            {isLong ? 'LONG' : 'SHORT'}
                          </Text>
                        </View>
                        <View style={styles.positionDetails}>
                          <Text style={styles.positionDetailText}>
                            Size: {Math.abs(positionSize).toFixed(4)}
                          </Text>
                          <Text style={styles.positionDetailText}>
                            Entry: ${parseFloat(position.entryPx).toFixed(2)}
                          </Text>
                        </View>
                        {currentPrice && (
                          <View style={styles.positionPnLRow}>
                            <Text style={styles.positionDetailText}>
                              Mark: ${parseFloat(currentPrice).toFixed(2)}
                            </Text>
                            <Text style={[
                              styles.positionPnL,
                              pnl >= 0 ? styles.pnlPositive : styles.pnlNegative
                            ]}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.closeButton,
                            closingPosition === position.coin && styles.closeButtonDisabled
                          ]}
                          onPress={() => handleClosePosition(position.coin, positionSize)}
                          disabled={closingPosition === position.coin}
                        >
                          <Text style={styles.closeButtonText}>
                            {closingPosition === position.coin ? 'Closing...' : 'Close Position'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Spot Balances Detail */}
            {nonZeroSpotBalances > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>Spot Balances</Text>
                {account.data.spotBalances
                  .filter(b => parseFloat(b.total) > 0)
                  .map((balance, idx) => {
                    const total = parseFloat(balance.total);
                    const price = wsState.prices[balance.coin];
                    const usdValue = price ? total * parseFloat(price) : null;
                    
                    return (
                      <View key={`balance-${idx}`}>
                        {idx > 0 && <View style={styles.summaryDivider} />}
                        <View style={styles.balanceItem}>
                          <Text style={styles.balanceCoin}>{balance.coin}</Text>
                          <View style={styles.balanceAmounts}>
                            <Text style={styles.balanceAmount}>{total.toFixed(6)}</Text>
                            {usdValue && (
                              <Text style={styles.balanceUsd}>${usdValue.toFixed(2)}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })
                }
              </View>
            )}

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


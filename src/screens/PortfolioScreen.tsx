import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { styles } from './styles/PortfolioScreen.styles';
import type { PerpPosition, UserFill } from '../types';

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

// Helper to format time
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default function PortfolioScreen(): React.JSX.Element {
  const { address } = useAccount();
  const { account } = useWallet();
  const { state: wsState } = useWebSocket();

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate total portfolio value and PnL
  const { totalValue, totalPnL } = useMemo(() => {
    if (!account.data) return { totalValue: 0, totalPnL: 0 };
    
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
    
    // Calculate total unrealized PnL
    let pnl = 0;
    account.data.perpPositions.forEach(position => {
      const price = wsState.prices[position.coin];
      if (price) {
        const { pnl: posPnl } = calculatePositionPnL(position, price);
        pnl += posPnl;
      }
    });
    
    return { totalValue: accountValue + spotValue, totalPnL: pnl };
  }, [account.data, wsState.prices]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Portfolio</Text>
        
        {!address && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No wallet connected</Text>
            <Text style={styles.emptySubtext}>
              Connect your wallet to view portfolio
            </Text>
          </View>
        )}

        {address && (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Connected Wallet</Text>
              <Text style={styles.walletAddress}>{formatAddress(address)}</Text>
            </View>

            {account.isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00FF94" />
                <Text style={styles.loadingText}>Loading portfolio data...</Text>
              </View>
            )}

            {account.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {account.error}</Text>
              </View>
            )}

            {!account.isLoading && !account.error && account.data && (
              <>
                {/* Portfolio Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Portfolio Value</Text>
                  <Text style={styles.portfolioValue}>${totalValue.toFixed(2)}</Text>
                  {totalPnL !== 0 && (
                    <Text style={[
                      styles.portfolioPnL,
                      totalPnL >= 0 ? styles.pnlPositive : styles.pnlNegative
                    ]}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} uPnL
                    </Text>
                  )}
                </View>

                {/* Account Details */}
                <View style={styles.detailsCard}>
                  <Text style={styles.cardTitle}>Account Details</Text>
                  
                  {account.data.perpMarginSummary.accountValue && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Perp Account Value</Text>
                      <Text style={styles.detailValue}>
                        ${parseFloat(account.data.perpMarginSummary.accountValue).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  
                  {account.data.perpMarginSummary.withdrawable && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Withdrawable</Text>
                      <Text style={styles.detailValue}>
                        ${parseFloat(account.data.perpMarginSummary.withdrawable).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  
                  {account.data.perpMarginSummary.totalMarginUsed && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Margin Used</Text>
                      <Text style={styles.detailValue}>
                        ${parseFloat(account.data.perpMarginSummary.totalMarginUsed).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Positions */}
                {account.data.perpPositions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Open Positions ({account.data.perpPositions.length})
                    </Text>
                    {account.data.perpPositions.map((position, idx) => {
                      const positionSize = parseFloat(position.szi);
                      const isLong = positionSize > 0;
                      const currentPrice = wsState.prices[position.coin];
                      const { pnl, pnlPercent } = currentPrice 
                        ? calculatePositionPnL(position, currentPrice)
                        : { pnl: 0, pnlPercent: 0 };
                      
                      return (
                        <View key={`position-${idx}`} style={styles.positionCard}>
                          <View style={styles.positionHeader}>
                            <Text style={styles.positionCoin}>{position.coin}</Text>
                            <Text style={[
                              styles.positionDirection,
                              isLong ? styles.directionLong : styles.directionShort
                            ]}>
                              {isLong ? 'LONG' : 'SHORT'}
                            </Text>
                          </View>
                          <View style={styles.positionDetail}>
                            <Text style={styles.positionDetailLabel}>Size:</Text>
                            <Text style={styles.positionDetailValue}>
                              {Math.abs(positionSize).toFixed(4)}
                            </Text>
                          </View>
                          <View style={styles.positionDetail}>
                            <Text style={styles.positionDetailLabel}>Entry:</Text>
                            <Text style={styles.positionDetailValue}>
                              ${parseFloat(position.entryPx).toFixed(2)}
                            </Text>
                          </View>
                          {currentPrice && (
                            <>
                              <View style={styles.positionDetail}>
                                <Text style={styles.positionDetailLabel}>Mark:</Text>
                                <Text style={styles.positionDetailValue}>
                                  ${parseFloat(currentPrice).toFixed(2)}
                                </Text>
                              </View>
                              <View style={styles.positionDetail}>
                                <Text style={styles.positionDetailLabel}>uPnL:</Text>
                                <Text style={[
                                  styles.positionPnL,
                                  pnl >= 0 ? styles.pnlPositive : styles.pnlNegative
                                ]}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Spot Balances */}
                {account.data.spotBalances.filter(b => parseFloat(b.total) > 0).length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Spot Balances ({account.data.spotBalances.filter(b => parseFloat(b.total) > 0).length})
                    </Text>
                    {account.data.spotBalances
                      .filter(b => parseFloat(b.total) > 0)
                      .map((balance, idx) => {
                        const total = parseFloat(balance.total);
                        const price = wsState.prices[balance.coin];
                        const usdValue = price ? total * parseFloat(price) : null;
                        
                        return (
                          <View key={`balance-${idx}`} style={styles.balanceCard}>
                            <View style={styles.balanceHeader}>
                              <Text style={styles.balanceCoin}>{balance.coin}</Text>
                              <Text style={styles.balanceAmount}>{total.toFixed(6)}</Text>
                            </View>
                            {usdValue && (
                              <Text style={styles.balanceUsd}>≈ ${usdValue.toFixed(2)}</Text>
                            )}
                          </View>
                        );
                      })
                    }
                  </View>
                )}

                {/* Open Orders */}
                {account.data.openOrders.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Open Orders ({account.data.openOrders.length})
                    </Text>
                    {account.data.openOrders.slice(0, 10).map((order: any, idx: number) => (
                      <View key={`order-${idx}`} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                          <Text style={styles.orderCoin}>{order.coin}</Text>
                          <Text style={[
                            styles.orderSide,
                            order.side === 'B' ? styles.sideBuy : styles.sideSell
                          ]}>
                            {order.side === 'B' ? 'BUY' : 'SELL'}
                          </Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={styles.orderLabel}>Price:</Text>
                          <Text style={styles.orderValue}>${order.limitPx}</Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={styles.orderLabel}>Size:</Text>
                          <Text style={styles.orderValue}>{order.sz}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent Trades */}
                {account.data.userFills.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Recent Trades ({account.data.userFills.length})
                    </Text>
                    {account.data.userFills.slice(0, 20).map((fill: UserFill, idx: number) => (
                      <View key={`fill-${idx}`} style={styles.tradeCard}>
                        <View style={styles.tradeHeader}>
                          <Text style={styles.tradeCoin}>{fill.coin}</Text>
                          <Text style={[
                            styles.tradeSide,
                            fill.side === 'B' ? styles.sideBuy : styles.sideSell
                          ]}>
                            {fill.side === 'B' ? 'BUY' : 'SELL'}
                          </Text>
                        </View>
                        <View style={styles.tradeDetail}>
                          <Text style={styles.tradeLabel}>
                            {fill.sz} @ ${parseFloat(fill.px).toFixed(2)}
                          </Text>
                          {fill.time && (
                            <Text style={styles.tradeTime}>
                              {new Date(fill.time).toLocaleString()}
                            </Text>
                          )}
                        </View>
                        {fill.closedPnl && parseFloat(fill.closedPnl) !== 0 && (
                          <Text style={[
                            styles.tradePnl,
                            parseFloat(fill.closedPnl) >= 0 ? styles.pnlPositive : styles.pnlNegative
                          ]}>
                            Realized PnL: {parseFloat(fill.closedPnl) >= 0 ? '+' : ''}${parseFloat(fill.closedPnl).toFixed(2)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}


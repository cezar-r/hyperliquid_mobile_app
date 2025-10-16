import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { styles } from './styles/PortfolioScreen.styles';
import type { PerpPosition, UserFill } from '../types';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import TransferToStakingModal from '../components/TransferToStakingModal';
import TransferFromStakingModal from '../components/TransferFromStakingModal';
import DelegateModal from '../components/DelegateModal';
import UndelegateModal from '../components/UndelegateModal';

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
  
  // Modal states
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [transferToStakingVisible, setTransferToStakingVisible] = useState(false);
  const [transferFromStakingVisible, setTransferFromStakingVisible] = useState(false);
  const [delegateModalVisible, setDelegateModalVisible] = useState(false);
  const [undelegateModalVisible, setUndelegateModalVisible] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<{ validator: `0x${string}`; amount: string } | null>(null);

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
                  
                  {/* Deposit and Withdraw Buttons */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.depositButton}
                      onPress={() => setDepositModalVisible(true)}
                    >
                      <Text style={styles.depositButtonText}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.withdrawButton}
                      onPress={() => setWithdrawModalVisible(true)}
                    >
                      <Text style={styles.withdrawButtonText}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Staking Section */}
                <View style={styles.stakingSection}>
                  <Text style={styles.sectionTitle}>Staking</Text>
                  
                  <View style={styles.stakingCard}>
                    {/* Staking Summary */}
                    <View style={styles.stakingSummaryRow}>
                      <View style={styles.stakingSummaryItem}>
                        <Text style={styles.stakingLabel}>Total Staked</Text>
                        <Text style={styles.stakingValue}>
                          {account.data.stakingSummary 
                            ? (parseFloat(account.data.stakingSummary.delegated || '0') + 
                               parseFloat(account.data.stakingSummary.undelegated || '0')).toFixed(2)
                            : '0.00'} HYPE
                        </Text>
                        {account.data.stakingSummary && (
                          <Text style={styles.stakingSubtext}>
                            Delegated: {parseFloat(account.data.stakingSummary.delegated || '0').toFixed(2)} HYPE
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.stakingSummaryItem}>
                        <Text style={styles.stakingLabel}>Spot Balance</Text>
                        <Text style={styles.stakingValue}>
                          {(() => {
                            const hypeBalance = account.data.spotBalances.find(b => b.coin === 'HYPE');
                            return hypeBalance ? parseFloat(hypeBalance.total).toFixed(2) : '0.00';
                          })()} HYPE
                        </Text>
                        <Text style={styles.stakingSubtext}>Available to stake</Text>
                      </View>
                    </View>

                    <View style={styles.stakingSummaryRow}>
                      <View style={styles.stakingSummaryItem}>
                        <Text style={styles.stakingLabel}>Available to Delegate</Text>
                        <Text style={styles.stakingValue}>
                          {account.data.stakingSummary 
                            ? parseFloat(account.data.stakingSummary.undelegated || '0').toFixed(2)
                            : '0.00'} HYPE
                        </Text>
                        <Text style={styles.stakingSubtext}>In staking balance</Text>
                      </View>

                      <View style={styles.stakingSummaryItem}>
                        <Text style={styles.stakingLabel}>Pending Transfers</Text>
                        <Text style={styles.stakingValue}>
                          {account.data.stakingSummary 
                            ? parseFloat(account.data.stakingSummary.totalPendingWithdrawal || '0').toFixed(2)
                            : '0.00'} HYPE
                        </Text>
                        <Text style={styles.stakingSubtext}>
                          {account.data.stakingSummary?.nPendingWithdrawals || 0} pending
                        </Text>
                      </View>
                    </View>

                    {/* Transfer Buttons */}
                    <View style={styles.stakingButtons}>
                      <TouchableOpacity 
                        style={styles.stakingButton}
                        onPress={() => setTransferToStakingVisible(true)}
                        disabled={!account.data.spotBalances.find(b => b.coin === 'HYPE') || 
                                  parseFloat(account.data.spotBalances.find(b => b.coin === 'HYPE')?.total || '0') <= 0}
                      >
                        <Text style={styles.stakingButtonText}>Transfer to Staking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.stakingButton}
                        onPress={() => setTransferFromStakingVisible(true)}
                        disabled={!account.data.stakingSummary || 
                                  parseFloat(account.data.stakingSummary.undelegated || '0') <= 0}
                      >
                        <Text style={styles.stakingButtonText}>Transfer to Spot</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Delegate Button */}
                    {account.data.stakingSummary && parseFloat(account.data.stakingSummary.undelegated || '0') > 0 && (
                      <TouchableOpacity 
                        style={styles.delegateButton}
                        onPress={() => setDelegateModalVisible(true)}
                      >
                        <Text style={styles.delegateButtonText}>Delegate to Validator</Text>
                      </TouchableOpacity>
                    )}

                    {/* Delegations List */}
                    {account.data.stakingDelegations.length > 0 && (
                      <View style={styles.delegationsContainer}>
                        <Text style={styles.delegationsTitle}>Active Delegations</Text>
                        {account.data.stakingDelegations.map((delegation, idx) => (
                          <View key={`delegation-${idx}`} style={styles.delegationCard}>
                            <View style={styles.delegationHeader}>
                              <Text style={styles.delegationValidator}>HYPE Foundation 1</Text>
                              <Text style={styles.delegationAmount}>
                                {parseFloat(delegation.amount).toFixed(2)} HYPE
                              </Text>
                            </View>
                            <Text style={styles.delegationAddress}>
                              {delegation.validator.slice(0, 10)}...{delegation.validator.slice(-8)}
                            </Text>
                            <TouchableOpacity 
                              style={styles.undelegateButton}
                              onPress={() => {
                                setSelectedDelegation({
                                  validator: delegation.validator,
                                  amount: delegation.amount,
                                });
                                setUndelegateModalVisible(true);
                              }}
                            >
                              <Text style={styles.undelegateButtonText}>Undelegate</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
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
      
      {/* Modals */}
      <DepositModal 
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
      />
      <WithdrawModal 
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
      />
      <TransferToStakingModal 
        visible={transferToStakingVisible}
        onClose={() => setTransferToStakingVisible(false)}
        maxAmount={(() => {
          const hypeBalance = account.data?.spotBalances.find(b => b.coin === 'HYPE');
          return hypeBalance ? parseFloat(hypeBalance.total) : 0;
        })()}
      />
      <TransferFromStakingModal 
        visible={transferFromStakingVisible}
        onClose={() => setTransferFromStakingVisible(false)}
        maxAmount={account.data?.stakingSummary 
          ? parseFloat(account.data.stakingSummary.undelegated || '0')
          : 0}
      />
      <DelegateModal 
        visible={delegateModalVisible}
        onClose={() => setDelegateModalVisible(false)}
        maxAmount={account.data?.stakingSummary 
          ? parseFloat(account.data.stakingSummary.undelegated || '0')
          : 0}
      />
      {selectedDelegation && (
        <UndelegateModal 
          visible={undelegateModalVisible}
          onClose={() => {
            setUndelegateModalVisible(false);
            setSelectedDelegation(null);
          }}
          validator={selectedDelegation.validator}
          maxAmount={parseFloat(selectedDelegation.amount)}
        />
      )}
    </View>
  );
}


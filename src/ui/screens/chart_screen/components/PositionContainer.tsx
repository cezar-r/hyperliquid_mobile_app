import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PositionCell } from '../../../shared/components';
import { getDisplayTicker } from '../../../../lib/formatting';
import { styles } from '../styles/PositionContainer.styles';
import { Color } from '../../../shared/styles';
import { playTextButtonHaptic } from '../../../../lib/haptics';

interface PositionContainerProps {
  marketType: 'perp' | 'spot';
  selectedCoin: string;
  // Perp position props
  perpPosition?: any;
  perpPrice?: number;
  perpMarginUsed?: number;
  perpPnl?: { pnl: number; pnlPercent: number };
  perpPriceChange?: number;
  perpEntryPrice?: number;
  perpPositionSize?: number;
  perpPositionValue?: number;
  perpLiquidationPrice?: number | null;
  perpFundingPaid?: number;
  onEditTpSl?: () => void;
  onMarketClose?: () => void;
  // Spot balance props
  spotBalance?: any;
  spotPrice?: number;
  spotUsdValue?: number;
  spotTotal?: number;
  spotPriceChange?: number;
  spotDisplayName?: string;
  spotPnl?: { pnl: number; pnlPercent: number };
}

// Helper to format numbers
function formatNumber(num: number, maxDecimals: number = 5): string {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export default function PositionContainer({
  marketType,
  selectedCoin,
  perpPosition,
  perpPrice,
  perpMarginUsed,
  perpPnl,
  perpPriceChange,
  perpEntryPrice,
  perpPositionSize,
  perpPositionValue,
  perpLiquidationPrice,
  perpFundingPaid,
  onEditTpSl,
  onMarketClose,
  spotBalance,
  spotPrice,
  spotUsdValue,
  spotTotal,
  spotPriceChange,
  spotDisplayName,
  spotPnl,
}: PositionContainerProps): React.JSX.Element {

  return (
    <View style={styles.positionsContainer}>
      <Text style={styles.sectionLabel}>
        {marketType === 'perp' ? 'Open Position' : 'Spot Balances'}
      </Text>
      
      {marketType === 'perp' ? (
        perpPosition ? (
          <>
            <PositionCell
              ticker={selectedCoin}
              price={perpPrice || 0}
              priceChange={perpPriceChange || 0}
              value={perpMarginUsed || 0}
              subValue={`${perpPnl && perpPnl.pnl >= 0 ? '+' : '-'}$${formatNumber(Math.abs(perpPnl?.pnl || 0), 2)}`}
              subValueColor={perpPnl && perpPnl.pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED}
              onPress={() => {}}
              isPerp={true}
              leverage={perpPosition.leverage?.value || 1}
              leverageType={perpPosition.leverage?.type 
                ? perpPosition.leverage.type.charAt(0).toUpperCase() + perpPosition.leverage.type.slice(1)
                : 'Cross'}
              isLong={parseFloat(perpPosition.szi) > 0}
              pnlPercent={perpPnl?.pnlPercent}
              tpPrice={perpPosition.tpPrice}
              slPrice={perpPosition.slPrice}
              showTpSl={true}
              onEditTpSl={onEditTpSl}
              showSeparator={false}
            />

            {/* Position details - always shown */}
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Entry Price</Text>
                <Text style={styles.detailValue}>
                  ${formatNumber(perpEntryPrice || 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Position Size</Text>
                <Text style={styles.detailValue}>
                  {formatNumber(Math.abs(perpPositionSize || 0), 4)} {selectedCoin}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Position Value</Text>
                <Text style={styles.detailValue}>
                  ${formatNumber(perpPositionValue || 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Liquidation Price</Text>
                <Text style={styles.detailValue}>
                  {perpLiquidationPrice && perpLiquidationPrice > 0
                    ? `$${formatNumber(perpLiquidationPrice)}`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Funding Paid</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: Color.RED },
                  ]}
                >
                  {perpFundingPaid !== undefined
                    ? `-$${formatNumber(Math.abs(perpFundingPaid), 2)}`
                    : 'N/A'}
                </Text>
              </View>
            </View>
            
            {onMarketClose && (
              <TouchableOpacity
                onPress={() => {
                  playTextButtonHaptic();
                  onMarketClose();
                }}
                style={styles.marketCloseButton}
              >
                <Text style={styles.marketCloseText}>
                  Market Close
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.subtitle}>No open perp position</Text>
        )
      ) : (
        spotBalance ? (
          <>
            <PositionCell
              ticker={spotBalance.coin}
              displayName={spotDisplayName}
              price={spotPrice || 0}
              priceChange={spotPriceChange || 0}
              value={spotUsdValue || 0}
              subValue={`${spotPnl && spotPnl.pnl >= 0 ? '+' : '-'}$${formatNumber(Math.abs(spotPnl?.pnl || 0), 2)}`}
              subValueColor={spotPnl && spotPnl.pnl >= 0 ? Color.BRIGHT_ACCENT : Color.RED}
              onPress={() => {}}
              showSeparator={false}
              pnlPercent={spotPnl?.pnlPercent}
            />

            {/* Spot balance details - always shown */}
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Entry Price</Text>
                <Text style={styles.detailValue}>
                  ${formatNumber(
                    spotTotal && spotTotal > 0
                      ? parseFloat(spotBalance.entryNtl || '0') / spotTotal
                      : 0
                  )}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.subtitle}>No balance for {selectedCoin.split('/')[0]}</Text>
        )
      )}
    </View>
  );
}



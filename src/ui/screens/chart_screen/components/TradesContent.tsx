import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LoadingBlob } from '../../../shared/components';
import { styles } from '../styles/TradesContent.styles';

interface Trade {
  px: string;
  sz: string;
  side: string; // 'A' = Ask (sell), 'B' = Bid (buy)
  time: number;
  tid: number | string;
  hash: string;
}

interface TradesContentProps {
  trades: Trade[];
}

// Helper function to format price with commas
function formatPrice(price: number | string): string {
  const value = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(value)) return '0';
  
  // Determine decimal places based on price magnitude
  let decimals = 2;
  if (value < 0.01) {
    decimals = 6;
  } else if (value < 1) {
    decimals = 4;
  } else if (value < 100) {
    decimals = 2;
  } else if (value >= 1000) {
    decimals = 1;
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function TradesContent({ trades }: TradesContentProps): React.JSX.Element {
  if (trades.length === 0) {
    return (
      <View style={styles.tradesFixedContainer}>
        <View style={styles.tradesLoadingContainer}>
            <LoadingBlob />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tradesFixedContainer}>
      <View style={styles.tradesHeader}>
        <Text style={styles.obColText}>Price</Text>
        <Text style={styles.obColText}>Size</Text>
        <Text style={styles.obColText}>Time</Text>
      </View>
      <ScrollView style={styles.tradesScrollContainer}>
        {trades.slice(0, 32).map((t, idx) => {
          const tradeTime = new Date(t.time);
          const timeStr = `${String(tradeTime.getHours()).padStart(2, '0')}:${String(tradeTime.getMinutes()).padStart(2, '0')}:${String(tradeTime.getSeconds()).padStart(2, '0')}`;
          const isBuy = t.side === 'B'; // B = Bid (buy), A = Ask (sell)
          
          return (
            <View key={`trade-${idx}-${t.tid}`} style={styles.tradeRow}>
              <Text style={[styles.tradePrice, isBuy ? styles.tradePriceBid : styles.tradePriceAsk]}>
                {formatPrice(t.px)}
              </Text>
              <Text style={styles.tradeSize}>
                {t.sz}
              </Text>
              <View style={styles.tradeTimeContainer}>
                <Text style={styles.tradeTime}>{timeStr}</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://app.hyperliquid.xyz/explorer/tx/${t.hash}`)}
                >
                  <Text style={styles.tradeExplorerLink}>↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}



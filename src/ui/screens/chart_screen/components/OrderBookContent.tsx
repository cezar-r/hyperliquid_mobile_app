import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { LoadingBlob } from '../../../shared/components';
import { styles } from '../styles/OrderBookContent.styles';

interface OrderBookLevel {
  px: string;
  sz: string;
  n: number;
}

interface TickSizeOption {
  label: string;
  value: number;
}

interface OrderBookContentProps {
  orderbook: {
    levels: [OrderBookLevel[], OrderBookLevel[]]; // [bids, asks]
  } | null;
  tickSize: number | null;
  tickSizeOptions: TickSizeOption[];
  showTickDropdown: boolean;
  onTickSizeChange: (tickSize: number) => void;
  onToggleDropdown: (show: boolean) => void;
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

export default function OrderBookContent({
  orderbook,
  tickSize,
  tickSizeOptions,
  showTickDropdown,
  onTickSizeChange,
  onToggleDropdown,
}: OrderBookContentProps): React.JSX.Element {
  if (!orderbook) {
    return (
      <View style={styles.orderbookFixedContainer}>
        <View style={styles.orderbookLoadingContainer}>
            <LoadingBlob />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.orderbookFixedContainer}>
      <View style={styles.obHeaderRow}>
        <TouchableOpacity 
          style={styles.tickDropdownButton}
          onPress={() => onToggleDropdown(true)}
        >
          <Text style={styles.tickDropdownValue}>
            {tickSize ? tickSizeOptions.find(opt => opt.value === tickSize)?.label : 'Auto'}
          </Text>
          <Text style={styles.tickDropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTickDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onToggleDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => onToggleDropdown(false)}
        >
          <View style={styles.tickDropdownMenu}>
            <ScrollView>
              {tickSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.tickDropdownItem,
                    tickSize === option.value && styles.tickDropdownItemActive,
                  ]}
                  onPress={() => {
                    onTickSizeChange(option.value);
                    onToggleDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tickDropdownItemText,
                      tickSize === option.value && styles.tickDropdownItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Two-column layout for orderbook */}
      <View style={styles.obSplitContainer}>
        {/* Left column - BIDS (descending) */}
        <View style={styles.obColumn}>
          <View style={styles.obColumnHeader}>
            <Text style={styles.obColHeaderText}>Price</Text>
            <Text style={styles.obColHeaderText}>Size</Text>
          </View>
          {(() => {
            // BIDS - sorted descending by price (highest first)
            const bidLevels = [...orderbook.levels[0]]
              .sort((a, b) => parseFloat(b.px) - parseFloat(a.px))
              .slice(0, 15);
            const bidCumulativeDepths = bidLevels.map((_, idx) => 
              bidLevels.slice(0, idx + 1).reduce((sum, l) => sum + parseFloat(l.sz || '0'), 0)
            );
            const maxBidDepth = Math.max(...bidCumulativeDepths, 1);

            return bidLevels.map((l, idx) => {
              const depth = Math.min(1, bidCumulativeDepths[idx] / maxBidDepth);
              return (
                <View key={`bid-${idx}`} style={styles.obRowSplit}>
                  <View style={[styles.obDepthBidSplit, { width: `${Math.round(depth * 100)}%` }]} />
                  <Text style={[styles.obPxSplit, styles.obPxBid]}>{formatPrice(l.px)}</Text>
                  <Text style={styles.obSzSplit}>{l.sz}</Text>
                </View>
              );
            });
          })()}
        </View>

        {/* Right column - ASKS (ascending) */}
        <View style={styles.obColumn}>
          <View style={styles.obColumnHeader}>
            <Text style={styles.obColHeaderText}>Price</Text>
            <Text style={styles.obColHeaderText}>Size</Text>
          </View>
          {(() => {
            // ASKS - sorted ascending by price (lowest first)
            const askLevels = [...orderbook.levels[1]]
              .sort((a, b) => parseFloat(a.px) - parseFloat(b.px))
              .slice(0, 15);
            // Cumulative depth accumulates from top down
            const askCumulativeDepths = askLevels.map((_, idx) => 
              askLevels.slice(0, idx + 1).reduce((sum, l) => sum + parseFloat(l.sz || '0'), 0)
            );
            const maxAskDepth = Math.max(...askCumulativeDepths, 1);

            return askLevels.map((l, idx) => {
              const depth = Math.min(1, askCumulativeDepths[idx] / maxAskDepth);
              return (
                <View key={`ask-${idx}`} style={styles.obRowSplit}>
                  <View style={[styles.obDepthAskSplit, { width: `${Math.round(depth * 100)}%` }]} />
                  <Text style={[styles.obPxSplit, styles.obPxAsk]}>{formatPrice(l.px)}</Text>
                  <Text style={styles.obSzSplit}>{l.sz}</Text>
                </View>
              );
            });
          })()}
        </View>
      </View>
    </View>
  );
}



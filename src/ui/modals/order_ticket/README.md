# Order Ticket Modal Refactoring

This directory contains the refactored order ticket components for both perpetual and spot trading.

## Structure

```
order_ticket/
├── PerpOrderTicket.tsx              # Main perp order ticket modal
├── SpotOrderTicket.tsx              # Main spot order ticket modal
├── components/                      # Modular subcomponents
│   ├── close_button/               # X button component
│   ├── toggle_container/           # Container for toggle buttons
│   ├── toggle_button/              # Reusable toggle button (buy/sell, limit/market, cross/isolated)
│   ├── price_container/            # Price input with label and "use market" button
│   ├── margin_container/           # Margin required input with slider (perps only)
│   ├── size_container/             # Size input with slider (spot only)
│   ├── leverage_container/         # Leverage slider (perps only)
│   ├── tpsl_container/             # TP/SL dropdown section (perps only)
│   ├── tif_selector/               # Time in Force picker (limit orders)
│   ├── reduce_only_checkbox/       # Reduce only checkbox (perps only)
│   ├── submit_button/              # Submit order button
│   ├── confirmation_modal/         # Order confirmation modal
│   └── index.ts                    # Component exports
├── styles/                         # Modal-level styles
│   ├── PerpOrderTicket.styles.ts
│   └── SpotOrderTicket.styles.ts
└── index.ts                        # Main exports

```

## Components

### Shared Components (Used by Both)

1. **CloseButton** - X button to close the modal
2. **ToggleContainer** - Wrapper for toggle button groups
3. **ToggleButton** - Reusable button with variants (default, buy, sell)
4. **PriceContainer** - Price input with market price button
5. **TifSelector** - Time in Force picker (GTC, IOC, ALO)
6. **SubmitButton** - Main action button with loading state
7. **ConfirmationModal** - Order confirmation dialog

### Perp-Only Components

1. **MarginContainer** - Margin required input with slider
2. **LeverageContainer** - Leverage slider with max leverage display
3. **TpSlContainer** - Take Profit / Stop Loss dropdown section with validation
4. **ReduceOnlyCheckbox** - Reduce only order option

### Spot-Only Components

1. **SizeContainer** - Token size input with slider

## Usage

### PerpOrderTicket

```typescript
import { PerpOrderTicket } from './ui/modals/order_ticket';

<PerpOrderTicket
  visible={showOrderTicket}
  onClose={() => setShowOrderTicket(false)}
  defaultSide="buy"
/>
```

### SpotOrderTicket

```typescript
import { SpotOrderTicket } from './ui/modals/order_ticket';

<SpotOrderTicket
  visible={showSpotOrderTicket}
  onClose={() => setShowSpotOrderTicket(false)}
  defaultSide="sell"
/>
```

## Key Features

- **Modular Design**: Each UI element is a separate, reusable component
- **Type Safety**: Full TypeScript support with proper interfaces
- **Styling Preservation**: All original styles maintained in component-specific style files
- **State Management**: All business logic remains in main ticket files
- **Haptic Feedback**: Integrated haptic feedback for user interactions
- **Validation**: Client-side validation for TP/SL prices and order parameters
- **Confirmation Flow**: Optional confirmation modal before order submission

## Component Props

Each component is designed with clear, minimal props for maximum reusability:

- **CloseButton**: `onPress`
- **ToggleButton**: `label`, `isActive`, `onPress`, `variant`
- **PriceContainer**: `coin`, `price`, `onPriceChange`, `currentPrice`, `orderType`, `onUseMarket`
- **MarginContainer**: `marginRequired`, `onMarginChange`, `tradeableBalance`, `sizePercent`, `onSizePercentChange`, `onSliderChange`
- **SubmitButton**: `label`, `onPress`, `disabled`, `isSubmitting`, `side`

## Notes

- Original `src/components/OrderTicket.tsx` and `src/components/SpotOrderTicket.tsx` files remain unchanged
- No breaking changes to existing functionality
- All business logic and state management preserved in main ticket components
- Components follow the established pattern from `ui/screens` and `ui/modals`


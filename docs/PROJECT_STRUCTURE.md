# Project Structure

This document explains the organization and architecture of the codebase.

## Directory Overview

```
HyperliquidMobileCompanionAppProd/
├── src/                    # Source code
├── assets/                 # Static assets (fonts, images)
├── docs/                   # Documentation
├── App.tsx                 # Root application component
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Source Code Structure (`src/`)

```
src/
├── ui/                     # User interface layer
├── contexts/               # React Context providers
├── lib/                    # Core utilities and SDK wrappers
├── types/                  # TypeScript type definitions
└── constants/              # App-wide constants
```

### UI Layer (`src/ui/`)

```
ui/
├── screens/                # Main application screens
├── modals/                 # Modal overlays
├── shared/                 # Shared UI components and styles
├── navigation/             # Navigation configuration
└── chart/                  # Chart integration
```

#### Screens (`src/ui/screens/`)

Each screen follows a modular structure with its own directory:

```
screens/
├── home_screen/
│   ├── HomeScreen.tsx              # Main screen component
│   ├── components/                 # Screen-specific components
│   │   ├── BalanceContent.tsx
│   │   ├── PerpPositionsContainer.tsx
│   │   ├── SpotBalancesContainer.tsx
│   │   ├── StakingContainer.tsx
│   │   ├── StarredTickersContainer.tsx
│   │   └── index.ts               # Component exports
│   └── styles/                     # Screen-specific styles
│       ├── HomeScreen.styles.ts
│       ├── BalanceContent.styles.ts
│       └── ...
│
├── browser_screen/
│   ├── BrowserScreen.tsx           # Web3-enabled browser
│   └── styles/
│       └── BrowserScreen.styles.ts
│
├── chart_screen/
│   ├── ChartScreen.tsx             # Main chart screen
│   ├── components/
│   │   ├── ChartHeader.tsx         # Ticker and timeframe selector
│   │   ├── ChartContent.tsx        # Chart display
│   │   ├── OrderBookContent.tsx    # Live order book
│   │   ├── TradesContent.tsx       # Recent trades
│   │   ├── PositionContainer.tsx   # Position display
│   │   ├── OpenOrdersContainer.tsx # Open orders list
│   │   ├── BuySellButtons.tsx      # Order ticket trigger
│   │   └── index.ts
│   └── styles/
│       └── ...
│
├── search_screen/
│   ├── SearchScreen.tsx            # Market search
│   └── ...
│
├── history_screen/
│   ├── HistoryScreen.tsx           # Transaction history
│   └── ...
│
├── profile_screen/
│   ├── ProfileScreen.tsx           # Settings and wallet info
│   └── ...
│
├── portfolio_screen/
│   ├── PortfolioScreen.tsx         # Detailed portfolio view
│   └── ...
│
└── index.ts                        # Screen exports
```

**Screen Architecture Pattern:**
- Each screen has its own directory
- Complex screens have a `components/` subdirectory for local components
- All styles are separated into `styles/` subdirectory
- Components are exported via `index.ts` barrel files

#### Modals (`src/ui/modals/`)

Modal components for overlays and dialogs:

```
modals/
├── order_ticket/
│   ├── PerpOrderTicket.tsx         # Perpetual order entry
│   ├── SpotOrderTicket.tsx         # Spot order entry
│   ├── components/                 # Shared order ticket components
│   └── styles/
│
├── deposit_modal/
│   ├── DepositModal.tsx            # L1 → Hyperliquid deposits
│   └── ...
│
├── withdraw_modal/
│   ├── WithdrawModal.tsx           # Hyperliquid → L1 withdrawals
│   └── ...
│
├── close_position_modal/
│   ├── ClosePositionModal.tsx      # Position closing
│   └── ...
│
├── tpsl_edit_modal/
│   ├── TPSLEditModal.tsx           # Take profit/stop loss editor
│   └── ...
│
├── perp_spot_transfer_modal/
│   ├── PerpSpotTransferModal.tsx   # Transfer between accounts
│   └── ...
│
├── delegate_modal/
│   ├── DelegateModal.tsx           # Staking delegation
│   └── ...
│
├── undelegate_modal/
│   ├── UndelegateModal.tsx         # Unstaking
│   └── ...
│
├── transfer_to_staking_modal/
│   └── ...
│
├── transfer_from_staking_modal/
│   └── ...
│
├── shared/                          # Shared modal components
│   ├── ModalHeader.tsx
│   ├── ModalButton.tsx
│   └── ...
│
└── index.ts                         # Modal exports
```

#### Shared Components (`src/ui/shared/`)

Reusable components used across multiple screens:

```
shared/
├── components/
│   ├── PanelSelector.tsx            # Tab selector with animation
│   ├── EmptyState.tsx               # Empty state placeholder
│   ├── ErrorState.tsx               # Error display
│   ├── SkeletonScreen.tsx           # Loading skeleton
│   ├── RecentTradesContainer.tsx    # Trades list
│   ├── LoadingBlob.tsx              # Animated loading indicator
│   └── ...
└── styles/
    ├── colors.ts                    # Color palette
    └── typography.ts                # Font styles
```

#### Navigation (`src/ui/navigation/`)

Navigation configuration and navigators:

```
navigation/
├── RootNavigator.tsx                # Root stack navigator
├── TabNavigator.tsx                 # Bottom tab navigator
└── TabNavigator.styles.ts           # Tab bar styles
```

**Navigation Structure:**
```
RootNavigator (Stack)
├── SplashScreen
├── ConnectScreen
├── EnableSessionKeyScreen
└── TabNavigator (Bottom Tabs)
    ├── HomeScreen
    ├── BrowserScreen
    ├── SearchScreen
    ├── HistoryScreen
    └── ProfileScreen
        └── SettingsScreen (Stack)
        └── PortfolioScreen (Stack)
        └── ChartScreen (Stack)
```

#### Chart Integration (`src/ui/chart/`)

WebView bridge for TradingView Lightweight Charts:

```
chart/
└── LightweightChartBridge.tsx       # WebView bridge component
```

### Contexts (`src/contexts/`)

React Context providers for global state:

```
contexts/
├── WalletContext.tsx                # Wallet connection and account state
│   ├── Wallet connection status
│   ├── Account data (balances, positions)
│   ├── ExchangeClient instance
│   ├── InfoClient instance
│   └── Account refresh methods
│
└── WebSocketContext.tsx             # Real-time market data
    ├── WebSocket connection management
    ├── Market subscriptions
    ├── Real-time price feeds
    ├── Order book updates
    └── Trade stream
```

### Libraries (`src/lib/`)

Core utilities and SDK wrappers:

```
lib/
├── appKitConfig.ts                  # WalletConnect (Reown AppKit) setup
├── hyperliquid.ts                   # Hyperliquid SDK client initialization
├── markets.ts                       # Market metadata and resolution
├── sessionKey.ts                    # Session key management
├── candleCache.ts                   # SQLite candle caching
├── starredTickers.ts                # Favorites persistence
├── formatting.ts                    # Price/size formatters
├── tickSize.ts                      # Tick size calculations
├── haptics.ts                       # Haptic feedback utilities
├── logger.ts                        # Logging and debugging
├── config.ts                        # Environment configuration
├── chains.ts                        # Chain definitions
├── contracts.ts                     # Contract addresses
├── deposit.ts                       # Deposit utilities
├── confirmations.ts                 # Transaction confirmations
├── wallet.ts                        # Wallet utilities
└── storage.ts                       # Storage wrappers
```

### Types (`src/types/`)

TypeScript type definitions:

```
types/
└── index.ts                         # All type definitions
    ├── Position types
    ├── Order types
    ├── Market types
    ├── Account types
    ├── Transaction types
    └── UI component types
```

### Constants (`src/constants/`)

Application-wide constants:

```
constants/
└── constants.ts                     # Configuration constants
```

## Assets (`assets/`)

Static assets used throughout the app:

```
assets/
├── fonts/
│   ├── Teodor.otf                   # Regular font
│   ├── TeodorMed.otf                # Medium weight
│   └── TeodorThin.otf               # Thin weight
│
├── hyperunit_deposits/              # Token icons
│   ├── btc.png
│   ├── eth.png
│   ├── hl.png
│   ├── sol.png
│   └── xpl.png
│
├── chart/
│   └── index.html                   # Lightweight Charts HTML
│
├── icon.png                         # App icon
├── adaptive-icon.png                # Android adaptive icon
├── splash-icon-new.png              # Splash screen
├── favicon.png                      # Web favicon
└── ...
```

## Configuration Files

### Root Level

- **App.tsx**: Root React component, sets up providers and navigation
- **index.ts**: Entry point, registers the root component
- **app.json**: Expo configuration (app name, version, permissions, etc.)
- **eas.json**: EAS build configuration
- **package.json**: Dependencies, scripts, and metadata
- **tsconfig.json**: TypeScript compiler configuration
- **babel.config.js**: Babel transpiler configuration
- **metro.config.js**: Metro bundler configuration
- **polyfills.js**: Browser API polyfills
- **.env**: Environment variables (gitignored)
- **LICENSE.md**: MIT license
- **README.md**: Project overview

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `HomeScreen.tsx`, `BalanceContent.tsx`)
- **Styles**: PascalCase with `.styles.ts` suffix (e.g., `HomeScreen.styles.ts`)
- **Utilities**: camelCase (e.g., `formatting.ts`, `sessionKey.ts`)
- **Types**: camelCase (e.g., `index.ts` in types directory)
- **Constants**: camelCase (e.g., `constants.ts`)

### Components
- Screen components: Suffix with `Screen` (e.g., `HomeScreen`, `ChartScreen`)
- Modal components: Suffix with `Modal` (e.g., `DepositModal`)
- Container components: Suffix with `Container` (e.g., `PositionsContainer`)
- Cell components: Suffix with `Cell` (e.g., `PerpPositionCell`)

### Exports
- Use named exports (not default exports)
- Export all public components via `index.ts` barrel files
- Keep internal components private to their directory

## Import Organization

Imports should be organized in the following order:

1. React and React Native imports
2. Third-party libraries
3. Context imports
4. Utility imports
5. Component imports
6. Type imports
7. Style imports

Example:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useWallet } from '../../../contexts/WalletContext';
import { formatPrice } from '../../../lib/formatting';
import { PerpPositionCell } from './components';
import type { PerpPosition } from '../../../types';
import { styles } from './styles/HomeScreen.styles';
```

## Code Organization Principles

### Modularity
- Each screen/feature is self-contained in its own directory
- Shared code is extracted to `shared/` or `lib/`
- No circular dependencies

### Separation of Concerns
- Business logic in contexts and utilities
- UI logic in components
- Styles in separate `.styles.ts` files
- Types in `types/` directory

### Single Responsibility
- Each component has one clear purpose
- Large components are broken into smaller sub-components
- Utilities are focused on specific tasks

### DRY (Don't Repeat Yourself)
- Shared components for common UI patterns
- Utility functions for repeated logic
- Barrel exports for cleaner imports

---

For more details on code style and conventions, see [CODE_STYLE.md](./CODE_STYLE.md).

For architecture patterns and design decisions, see [ARCHITECTURE_HIGHLIGHTS.md](./ARCHITECTURE_HIGHLIGHTS.md).


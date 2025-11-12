# App Screens Overview

This document provides a detailed tour of all screens in the Hyperliquid Mobile Companion app.

## Navigation Structure

The app uses a tab-based navigation with 5 main screens accessible from the bottom tab bar:

```
Bottom Tab Bar
├── 🏠 Home
├── 🌐 Browser
├── 🔍 Search
├── 📜 History
└── 👤 Profile
```

Additional screens are accessible via navigation from the main tabs:
- **📊 Chart** (from Home, Search, or Browser)
- **💼 Portfolio** (from Profile)
- **⚙️ Settings** (from Profile)

---

## 🏠 Home Screen

**Purpose**: Main dashboard for viewing portfolio, positions, and balances.

### Features

#### Swipeable Panel Selector
Toggle between three views with swipe gestures:
1. **Perp** - Perpetual futures positions
2. **Spot** - Spot asset balances
3. **Account** - Account overview with staking

#### Balance Header
- **Account Value**: Total portfolio value in USD
- **Withdrawable**: Available USDC for withdrawal
- **Color-coded Changes**: Green for gains, red for losses
- **Animated Updates**: Smooth transitions on balance changes

#### Perp View
- List of all open perpetual positions
- For each position:
  - Coin name and leverage (e.g., "BTC 20x")
  - Position size and direction (long/short)
  - Entry price vs. current price
  - Unrealized PnL ($ and %)
  - Liquidation price
- **Actions**:
  - Tap to navigate to chart screen
  - Swipe left to reveal "Close" button
  - Long-press for position details

#### Spot View
- List of all spot asset balances
- For each asset:
  - Coin name and icon
  - Balance amount
  - USD value
  - 24h price change (%)
- **Hide Small Balances**: Toggle to hide balances < $1
- Tap to navigate to spot chart

#### Account View
- **Staking Info**:
  - Total HYPE staked
  - Active delegations
  - Pending rewards
- **Quick Actions**:
  - Deposit funds
  - Withdraw funds
  - Transfer to staking
  - Perp/Spot transfer

#### Starred Tickers
- Quick access to favorite markets
- Shows 24h trading volume
- Tap to navigate to chart
- Unified list for both perp and spot markets

### Interactions
- **Pull to Refresh**: Reload account data
- **Swipe Left/Right**: Switch between Perp/Spot/Account
- **Tap Position**: Navigate to chart screen
- **Tap Balance**: Navigate to spot chart

---

## 🌐 Browser Screen

**Purpose**: Integrated Web3-enabled browser for accessing dApps.

### Features

#### Address Bar
- URL input with autocomplete
- Current page title display
- HTTPS indicator
- Loading progress bar

#### Navigation Controls
- **Back Button**: Navigate to previous page
- **Forward Button**: Navigate to next page
- **Refresh Button**: Reload current page
- **Home Button**: Return to default URL

#### Web3 Provider Injection
- Automatically injects Ethereum provider
- Appears as MetaMask to dApps
- EIP-1193 compliant
- EIP-6963 multi-provider discovery

#### Connected Wallet Integration
- Auto-connects your WalletConnect wallet
- No manual connection prompts
- Signs transactions via your connected wallet
- Bridges all RPC calls

#### Default Page
Opens to `https://app.hyperliquid.xyz` by default, giving you immediate access to:
- Hyperliquid web trading interface
- All advanced trading features
- Portfolio analytics
- Market data

### Supported dApps
Works with any Ethereum-compatible dApp:
- Hyperliquid web app
- Uniswap
- Aave
- Curve
- Any DeFi protocol with web interface

### Interactions
- **Type URL**: Enter any website address
- **Tap Links**: Navigate within sites
- **Sign Transactions**: Approve via WalletConnect
- **Back/Forward**: Standard browser navigation

---

## 🔍 Search Screen

**Purpose**: Find and navigate to any trading pair.

### Features

#### Search Bar
- Real-time search as you type
- Searches both perp and spot markets
- Matches ticker symbols and full names

#### Market Type Filter
- **All Markets**: Show both perp and spot
- **Perp Only**: Filter to perpetuals
- **Spot Only**: Filter to spot markets

#### Market List
For each market:
- Coin name and type (PERP/SPOT badge)
- Current price
- 24h price change (% and color-coded)
- 24h trading volume
- Star icon (filled if starred)

#### Quick Actions
- **Tap Market**: Navigate to chart screen
- **Tap Star**: Add/remove from favorites
- **Pull to Refresh**: Update market data

### Interactions
- **Search**: Type to filter markets
- **Star/Unstar**: Tap star icon
- **Navigate**: Tap market row to open chart
- **Switch Filters**: Toggle between All/Perp/Spot

---

## 📊 Chart Screen (Detail View)

**Purpose**: Advanced charting and order entry for a specific market.

### Layout

#### Top Section: Chart Header
- **Ticker Name**: Current market (e.g., "BTC", "ETH")
- **Current Price**: Real-time price with change indicator
- **24h Stats**: High, low, volume, change %
- **Star Button**: Add to favorites
- **Timeframe Selector**: 1m, 5m, 15m, 1h, 4h, 1d

#### Middle Section: Interactive Chart
- **Candlestick Chart**: OHLC data with volume
- **Crosshair**: Tap and hold to see exact values
- **Zoom**: Pinch to zoom in/out
- **Pan**: Drag to scroll through history
- **Position Markers**: Visual indicators for open positions
- **Price Lines**: Entry price, liquidation price, TP/SL levels

#### Bottom Section: Tabbed Panels
Toggle between three views:
1. **Order Book**: Live bid/ask orders
2. **Trades**: Recent market trades
3. **Info**: Market statistics

#### Position Container (if open)
- Current position details
- Unrealized PnL
- **Edit TP/SL**: Set take profit and stop loss
- **Close Position**: Quick close button

#### Open Orders Container
- List of active orders
- Order details (type, price, size)
- **Cancel Button**: Cancel individual orders
- **Cancel All**: Cancel all open orders

#### Buy/Sell Buttons
- **Buy/Long**: Open order ticket in buy mode
- **Sell/Short**: Open order ticket in sell mode
- Color-coded (green/red)

### Order Ticket Modal

#### Order Types
- **Market**: Instant execution at current price
- **Limit**: Execute at specific price or better
- **Stop Market**: Trigger market order at stop price
- **Stop Limit**: Trigger limit order at stop price

#### Order Settings
- **Size**: Amount to trade (USD or coin amount)
- **Price**: Limit price (for limit orders)
- **Stop Price**: Trigger price (for stop orders)
- **Leverage**: 1x to max leverage (perp only)
- **Reduce Only**: Only close existing positions
- **Post Only**: Only make maker orders
- **Time in Force**: GTC, IOC, FOK

#### Order Preview
- Estimated cost/proceeds
- Estimated fees
- Post-trade position
- Liquidation price (if applicable)

### Interactions
- **Tap Chart**: Show crosshair and price
- **Pinch Chart**: Zoom in/out
- **Drag Chart**: Pan left/right
- **Change Timeframe**: Tap timeframe buttons
- **View Order Book**: Tap order book tab
- **Place Order**: Tap Buy/Sell button
- **Edit TP/SL**: Tap "Edit TP/SL" on position
- **Close Position**: Tap "Close" button

---

## 📜 History Screen

**Purpose**: Complete transaction history and ledger.

### Features

#### Filter Bar
Filter by action type:
- **All**: Show all transactions
- **Trades**: Only trade executions
- **Deposits**: Only deposits
- **Withdrawals**: Only withdrawals
- **Transfers**: Internal transfers
- **Staking**: Staking actions

#### Transaction List
For each transaction:
- **Type Badge**: Color-coded transaction type
- **Coin/Market**: Asset or trading pair
- **Amount**: Transaction amount
- **Price**: Execution price (for trades)
- **Timestamp**: Date and time
- **Status**: Completed, pending, failed
- **Details Button**: Expand for full details

#### Expanded Details
- Transaction hash (for on-chain txs)
- Full order details
- Fee breakdown
- PnL calculation (for closed positions)
- Copy transaction ID

#### Pagination
- Infinite scroll to load more history
- Pull to refresh latest transactions
- Loading indicator while fetching

### Interactions
- **Filter**: Tap filter buttons
- **Expand**: Tap transaction to see details
- **Copy**: Copy transaction ID or hash
- **Pull to Refresh**: Reload recent history
- **Scroll**: Load more historical data

---

## 👤 Profile Screen

**Purpose**: Wallet info, settings, and navigation to other screens.

### Sections

#### Wallet Information
- **Connected Address**: Your wallet address
- **Address Display**: Truncated with copy button (0x1234...5678)
- **Network**: Current chain (e.g., Arbitrum)
- **Session Key Status**: Active/Inactive indicator

#### Quick Actions
- **View Portfolio**: Navigate to detailed portfolio screen
- **Session Keys**: Enable/disable session keys
- **Auto-Approve**: Toggle automatic order approval

#### Settings
- **Clear Cache**: Clear local caches
- **Network Status**: Connection status
- **Version Info**: App version and build number

#### Disconnect Button
- Sign out of current wallet
- Returns to connect screen
- Clears session data

### Navigation Links
- **Portfolio Screen**: Detailed portfolio analytics
- **Settings Screen**: Advanced settings

### Interactions
- **Copy Address**: Tap to copy wallet address
- **Toggle Session Key**: Enable/disable gasless trading
- **Toggle Auto-Approve**: Turn on/off automatic approvals
- **Clear Cache**: Tap to clear cached data
- **Disconnect**: Tap to sign out

---

## 💼 Portfolio Screen (Accessed from Profile)

**Purpose**: Detailed portfolio analytics and statistics.

### Features

#### Account Summary
- **Total Equity**: Account value with chart
- **Account Value Breakdown**:
  - Perp account value
  - Spot account value
  - Staking balance
- **Equity Chart**: Historical equity graph

#### PnL Breakdown
- **Unrealized PnL**: Open positions
- **Realized PnL**: Closed positions
- **Time Filters**: 24h, 7d, 30d, All time
- **PnL Chart**: Visual representation over time

#### Trading Volume
- **Total Volume**: By time period
- **Volume Breakdown**: By market
- **Maker vs. Taker**: Volume split
- **Fee Summary**: Total fees paid

#### Staking Details
- **Active Delegations**: List of validators
- **Total Staked**: Amount and USD value
- **Rewards**: Accumulated rewards
- **APY**: Current annual percentage yield
- **Actions**: Delegate, undelegate, claim rewards

#### Positions & Balances
- **All Positions**: Complete position list
- **All Balances**: Complete balance list
- **Sort Options**: By size, PnL, time

### Interactions
- **Change Time Period**: Tap time filter buttons
- **View Details**: Tap on any item
- **Delegate**: Open delegation modal
- **Claim Rewards**: Claim staking rewards

---

## ⚙️ Settings Screen (Accessed from Profile)

**Purpose**: Advanced configuration and preferences.

### Settings Categories

#### Trading Preferences
- **Default Order Type**: Market, limit, or last used
- **Confirmation Dialogs**: Enable/disable order confirmations
- **Slippage Tolerance**: Set acceptable slippage %

#### Display Settings
- **Theme**: Dark mode (currently only option)
- **Price Decimals**: Decimal places for prices
- **Hide Small Balances**: Auto-hide threshold

#### Notifications (Future)
- **Price Alerts**: Enable/disable price notifications
- **Position Alerts**: Liquidation warnings
- **Order Fills**: Trade execution notifications

#### Advanced
- **Developer Mode**: Enable advanced features
- **API Endpoint**: Custom Hyperliquid API URL
- **Cache Management**: View and clear caches
- **Export Data**: Export trading history

#### About
- **Version**: App version number
- **Build**: Build identifier
- **License**: View license information
- **Support**: Contact support

### Interactions
- **Toggle Settings**: Switch options on/off
- **Change Values**: Adjust numeric settings
- **Clear Data**: Reset specific caches
- **View Logs**: Access debug logs (developer mode)

---

## Screen Flow Summary

### Typical User Journeys

#### Quick Trade Flow
1. **Home** → Tap starred ticker
2. **Chart** → Tap Buy/Sell
3. **Order Ticket** → Enter details → Submit
4. **Chart** → View position

#### Browse and Trade Flow
1. **Search** → Find market
2. **Chart** → Analyze
3. **Order Ticket** → Place order
4. **History** → Confirm execution

#### Web Trading Flow
1. **Browser** → Navigate to Hyperliquid
2. **Web App** → Trade on web interface
3. **Wallet** → Sign transactions
4. **Home** → View updated positions

#### Portfolio Management Flow
1. **Home** → View overview
2. **Profile** → Portfolio
3. **Portfolio** → Analyze performance
4. **Home** → Manage positions

#### Funds Management Flow
1. **Home** → Account tab
2. **Deposit Modal** → Add funds
3. **Transfer Modal** → Move funds
4. **Staking Modal** → Stake tokens

---

For more information on specific features, see [FEATURES.md](./FEATURES.md).

For navigation implementation details, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).


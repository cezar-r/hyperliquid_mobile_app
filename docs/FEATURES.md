# Features

This document provides a comprehensive overview of all features available in the Hyperliquid Mobile Companion app.

## Core Trading

### Perpetual & Spot Trading
Full-featured order ticket supporting multiple order types:
- **Market Orders**: Instant execution at current market price
- **Limit Orders**: Execute at a specific price or better
- **Stop Orders**: Trigger orders based on price conditions
- **Leverage Control**: Adjust leverage from 1x to 50x (depending on market)
- **Advanced Options**: Reduce-only, post-only, IOC, and GTC time-in-force

### Real-time Order Book
- Live bid/ask spreads with depth visualization
- Continuous updates via WebSocket connection
- Color-coded price levels for easy reading
- Aggregate order sizes at each price level

### Recent Trades Feed
- Live trade stream showing all market trades
- Price, size, and timestamp for each trade
- Buy/sell indicators with color coding
- Auto-scrolling to latest trades

### Portfolio Management
Track your entire portfolio in real-time:
- **Positions**: View all open perp positions with unrealized PnL
- **Balances**: Spot balances across all assets
- **Total PnL**: Aggregate profit/loss across all positions
- **Trading Volume**: 24h, 7d, and 30d trading volume statistics
- **Account Value**: Total account equity with breakdown

### Advanced Charting
Interactive TradingView-style charts:
- **OHLC Candles**: Professional candlestick charts
- **Multiple Timeframes**: 1m, 5m, 15m, 1h, 4h, 1d
- **Technical Overlays**: Volume, price markers, and position indicators
- **Touch Interactions**: Pinch to zoom, drag to pan
- **Cached Data**: SQLite caching for instant chart loading

### Starred Markets
- Quick access to favorite trading pairs
- 24h volume tracking for each starred market
- Price change indicators (positive/negative)
- One-tap navigation to chart screen

## Wallet & Funds Management

### Multi-Wallet Support
Connect via WalletConnect to 40+ wallets including:
- MetaMask, Rainbow, Trust Wallet
- Coinbase Wallet, Ledger Live
- Argent, Gnosis Safe, Zerion
- Phantom, Brave Wallet, OKX
- And many more...

### Deposits & Withdrawals
Bridge assets between chains:
- **Deposit**: L1 (Arbitrum) → Hyperliquid L1
- **Withdraw**: Hyperliquid L1 → Arbitrum
- **Supported Assets**: USDC, BTC, ETH, SOL, XPL, HYPE
- **Bridge Status**: Real-time transaction tracking
- **Gas Estimation**: Estimate costs before confirming

### Perp/Spot Transfers
Seamlessly move funds between accounts:
- Transfer between perpetual and spot trading accounts
- Instant transfers (no blockchain confirmation needed)
- No fees for internal transfers
- Maximum available balance calculator

### Staking & Delegation
Participate in network security:
- **Stake HYPE**: Lock HYPE tokens for rewards
- **Delegate**: Choose validators to delegate to
- **Undelegate**: Unstake with unbonding period
- **Rewards Tracking**: View accumulated staking rewards
- **Validator Info**: APY, commission rates, and performance

### Session Keys
Enable gasless, high-frequency trading:
- **One-Time Setup**: Sign a message to authorize a temporary key
- **Secure Storage**: Keys stored in device's Secure Enclave (iOS) or Keystore (Android)
- **Auto-Trading**: Place orders without signing each transaction
- **Auto-Approve**: Optional automatic order approval
- **Revocable**: Disable or regenerate keys at any time from settings
- **Expiration**: Keys expire after a configurable period for security

## Integrated Web Browser

### Built-in dApp Browser
Full WebView with Web3 provider injection:
- Navigate to any website or dApp
- Address bar with URL input
- Forward/back navigation
- Refresh functionality

### Wallet Integration
Your connected wallet is automatically available to all dApps:
- **Auto-Connect**: Appears as MetaMask to dApps
- **No Prompts**: Seamless connection without manual approval
- **Multi-Chain**: Works with Ethereum, Arbitrum, and EVM chains
- **Transaction Signing**: Routes all signature requests to your WalletConnect wallet

### EIP-6963 Support
Modern wallet detection standard:
- Multi-provider discovery
- Priority announcement as MetaMask
- Compatible with latest dApp frameworks
- Future-proof wallet integration

### Request Bridging
Bridges the following Ethereum RPC methods:
- `eth_sendTransaction` - Send transactions
- `personal_sign` - Sign messages
- `eth_signTypedData_v4` - Sign typed data
- `eth_accounts` / `eth_requestAccounts` - Get connected accounts
- `eth_chainId` / `net_version` - Network information

### Default URL
- Opens to `https://app.hyperliquid.xyz` by default
- Fully customizable via address bar
- Use Hyperliquid web interface directly from mobile
- Access any DeFi protocol (Uniswap, Aave, etc.)

## Other Features

### Dark Mode
Beautiful dark theme optimized for trading:
- Custom color palette designed for long trading sessions
- High contrast for important information
- Reduced eye strain in low-light environments
- Consistent theming across all screens

### Haptic Feedback
Tactile responses for all interactions:
- Navigation taps
- Order placement confirmation
- Error feedback
- Swipe gesture acknowledgments
- Custom vibration patterns per action type

### Swipe Navigation
Gesture-based navigation:
- Swipe between Perp, Spot, and Account views on home screen
- Swipe between Chart, Order Book, and Trades on chart screen
- Smooth animated transitions
- Intuitive left/right gestures

### Real-time Updates
WebSocket connections for live data:
- Sub-second price updates
- Instant position updates
- Live balance changes
- Order status updates
- Market data streaming

### Transaction History
Complete ledger of all activity:
- All trades with entry/exit prices
- Deposits and withdrawals
- Transfers between accounts
- Staking actions (delegate, undelegate)
- Filter by action type
- Infinite scroll pagination
- Detailed transaction information

### Search Markets
Quickly find any trading pair:
- Search by ticker symbol
- Filter by perp vs spot
- Real-time price display
- 24h change indicators
- Star/unstar from search
- Quick navigation to chart

### Price Alerts
Mark important price levels on charts:
- Visual price line indicators
- Custom price markers
- Visual cues for significant levels
- Persistent across sessions

---

## Feature Roadmap

Planned features for future releases:
- Push notifications for price alerts
- Advanced order types (OCO, bracket orders)
- Portfolio analytics and reports
- Trade history export (CSV)
- Multiple account support
- Biometric authentication
- Tablet optimization
- Android widget support

For the latest feature updates and requests, see [.cursor/BACKLOG.md](../.cursor/BACKLOG.md).


# Hyperliquid Mobile Companion

A React Native mobile application for interacting with the Hyperliquid decentralized exchange.

## Features

### Core Trading
- **Perpetual & Spot Trading**: Full order ticket with market/limit/stop orders, leverage control, and advanced options
- **Real-time Order Book**: Live bid/ask spreads with depth visualization
- **Recent Trades Feed**: Live trade stream with price/volume data
- **Portfolio Management**: Track positions, balances, PnL, and trading volume across perp and spot markets
- **Advanced Charting**: Interactive TradingView-style charts with OHLC candles, multiple timeframes (1m-1d), and technical overlays
- **Starred Markets**: Quick access to favorite trading pairs with 24h volume tracking

### Wallet & Funds Management
- **Multi-Wallet Support**: Connect via WalletConnect with 40+ supported wallets (MetaMask, Rainbow, Trust, etc.)
- **Deposits & Withdrawals**: Bridge assets between L1 chains (Arbitrum) and Hyperliquid
- **Perp/Spot Transfers**: Seamlessly move funds between perpetual and spot accounts
- **Staking & Delegation**: Stake HYPE tokens, delegate to validators, and manage rewards
- **Session Keys**: Enable gasless trading with temporary signing keys for faster execution

### Integrated Web Browser
- **Built-in dApp Browser**: Full WebView with Web3 provider injection
- **Wallet Integration**: Automatically connects your wallet to any dApp (appears as MetaMask)
- **EIP-6963 Support**: Multi-provider discovery for maximum compatibility
- **Default URL**: Opens to Hyperliquid web app (customizable)
- **Seamless Trading**: Use any DeFi protocol with your connected wallet

### Other
- **Dark Mode**: Beautiful dark theme optimized for trading
- **Haptic Feedback**: Tactile responses for all interactions
- **Swipe Navigation**: Gesture-based navigation between sections
- **Real-time Updates**: WebSocket connections for live market data
- **Transaction History**: Complete ledger of all trades, transfers, and actions
- **Search Markets**: Quickly find any trading pair
- **Price Alerts**: Mark prices with visual indicators on charts

## Tech Stack

### Frontend
- **Framework**: Expo SDK 54 + React Native 0.81.4 + TypeScript 5.9
- **Navigation**: React Navigation 7 (Bottom Tabs + Native Stack)
- **UI Components**: Custom components with Reanimated 4 + Gesture Handler
- **Charts**: Lightweight Charts (via WebView bridge) + react-native-wagmi-charts
- **Animations**: React Native Reanimated 4.1 + Animated API
- **Icons**: Expo Vector Icons (MaterialCommunityIcons, Ionicons, MaterialIcons)

### Blockchain & Web3
- **Wallet Connection**: Reown AppKit 2.0 (formerly WalletConnect) + Ethers.js
- **Chain Support**: Ethereum Mainnet, Arbitrum
- **Hyperliquid SDK**: @nktkas/hyperliquid 0.25.1 for trading, positions, and market data
- **Web3 Provider**: Custom EIP-1193 provider injection for dApp browser
- **Transaction Signing**: viem 2.38 for typed data signing

### Data & State Management
- **State**: React Context API + Hooks
- **WebSocket**: Real-time price feeds, order book, and trade updates
- **Local Storage**: AsyncStorage for preferences, SecureStore for sensitive data
- **Database**: Expo SQLite for candle caching and historical data
- **Network Monitoring**: NetInfo for connectivity detection

### Development Tools
- **Build System**: Expo Application Services (EAS) for iOS/Android builds
- **Linting**: ESLint 9 + TypeScript ESLint
- **Formatting**: Prettier 3.6
- **Type Checking**: TypeScript strict mode
- **Testing**: Expo DevTools

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **macOS** (required for iOS builds)
- **Node.js 18+** and npm
- **Git**
- **Xcode** (latest version from Mac App Store)
- **Xcode Command Line Tools**: `xcode-select --install`

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/hyperliquid-mobile-companion.git
cd hyperliquid-mobile-companion
```

### Step 2: Install Global Dependencies

```bash
# Install Expo CLI
npm install -g @expo/cli

# Install EAS CLI (for building and submitting to TestFlight)
npm install -g eas-cli
```

### Step 3: Install Project Dependencies

```bash
npm install
```

### Step 4: Set Up WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```env
WALLETCONNECT_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_HL_ENV=testnet
# EXPO_PUBLIC_HL_API_URL=  # Optional override
```

Replace `your_project_id_here` with your actual WalletConnect Project ID.

### Step 6: Running the App Locally (Optional)

Test the app in development before building:

```bash
# Start development server
npx expo start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
src/
├── ui/
│   ├── screens/              # Main app screens
│   │   ├── home_screen/      # Portfolio dashboard with positions & balances
│   │   ├── browser_screen/   # Integrated dApp browser with Web3 injection
│   │   ├── chart_screen/     # Advanced charting with order entry
│   │   ├── search_screen/    # Market search and discovery
│   │   ├── history_screen/   # Transaction ledger and history
│   │   ├── profile_screen/   # Settings and wallet info
│   │   └── portfolio_screen/ # Detailed portfolio analytics
│   ├── modals/              # Modal components
│   │   ├── order_ticket/    # Perp & spot order entry modals
│   │   ├── deposit_modal/   # L1 → Hyperliquid bridge
│   │   ├── withdraw_modal/  # Hyperliquid → L1 withdrawals
│   │   ├── close_position_modal/
│   │   ├── tpsl_edit_modal/ # Take profit / stop loss editor
│   │   ├── delegate_modal/  # Staking delegation
│   │   └── perp_spot_transfer_modal/
│   ├── shared/
│   │   ├── components/      # Reusable UI components
│   │   └── styles/          # Shared style utilities
│   ├── navigation/          # Tab & stack navigators
│   └── chart/               # Lightweight Charts WebView bridge
├── contexts/                # React Context providers
│   ├── WalletContext.tsx    # Wallet state & connection management
│   └── WebSocketContext.tsx # Real-time market data streams
├── lib/                     # Core utilities and SDK wrappers
│   ├── appKitConfig.ts      # WalletConnect configuration
│   ├── hyperliquid.ts       # Hyperliquid client initialization
│   ├── markets.ts           # Market metadata and resolution
│   ├── sessionKey.ts        # Session key management
│   ├── candleCache.ts       # SQLite candle caching
│   ├── starredTickers.ts    # Favorites persistence
│   ├── formatting.ts        # Price/size formatters
│   ├── tickSize.ts          # Tick size calculations
│   ├── haptics.ts           # Haptic feedback utilities
│   └── logger.ts            # Logging and debugging
├── types/                   # TypeScript type definitions
│   └── index.ts             # Shared types and interfaces
└── constants/               # App-wide constants
    └── constants.ts
```

## Key Features Explained

### Integrated dApp Browser

The app includes a sophisticated in-app browser that injects a Web3 provider, making your connected wallet available to any dApp:

- **EIP-1193 Provider**: Fully compliant Ethereum provider API
- **MetaMask Compatibility**: Appears as MetaMask to dApps for maximum compatibility
- **EIP-6963 Multi-Provider Discovery**: Modern wallet detection standard
- **Request Bridging**: Bridges `eth_sendTransaction`, `personal_sign`, `eth_signTypedData_v4` to your actual wallet
- **Auto-Connect**: Automatically connects to dApps without manual prompts
- **Default URL**: `https://app.hyperliquid.xyz` (configurable)

This means you can:
- Trade on Hyperliquid's web interface directly from the app
- Use Uniswap, Aave, or any DeFi protocol with your wallet
- Sign transactions that get routed to your connected WalletConnect wallet

### Session Keys

Session keys enable gasless, high-frequency trading:

1. **One-Time Setup**: Sign a message to authorize a temporary key
2. **Secure Storage**: Keys stored in device's Secure Enclave
3. **Auto-Trading**: Place orders without signing each transaction
4. **Revocable**: Can be disabled at any time from settings

### Real-Time Market Data

WebSocket connections provide live updates:
- **Price Feeds**: Sub-second price updates for all markets
- **Order Book**: Live bid/ask depth with auto-updates
- **Recent Trades**: Streaming trade feed
- **User Updates**: Instant position, balance, and order updates

## Development

### Code Style

- Follow guidelines in `CODE_STYLE.md`
- Lines should not exceed 100 characters
- Use TypeScript strict mode
- Prefer named exports over default exports
- Each screen/component should have its own directory with separate `.tsx` and `.styles.ts` files

### Linting and Formatting

```bash
npm run lint
npm run format
npm run type-check
```

## Deploying to TestFlight

### Prerequisites for TestFlight Deployment

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Complete enrollment process (may take 24-48 hours)

2. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Free for unlimited builds

### Step 1: Configure EAS (Expo Application Services)

First, log in to your Expo account:

```bash
eas login
```

### Step 2: Update App Configuration

Edit `app.json` to customize your app:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "owner": "your-expo-username"
  }
}
```

**Important**: Change these values:
- `name`: Your app's display name
- `slug`: URL-friendly name
- `bundleIdentifier`: Unique identifier (reverse domain notation)
- `owner`: Your Expo username

### Step 3: Configure EAS Build

If this is your first build, initialize EAS:

```bash
eas build:configure
```

This creates an `eas.json` file. Verify it contains an iOS configuration.

### Step 4: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Your app name (must be unique on App Store)
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: Must match your `bundleIdentifier` from `app.json`
   - **SKU**: Any unique identifier (e.g., `your-app-001`)
   - **User Access**: Full Access

### Step 5: Build for iOS

Build your app for iOS (this takes 15-30 minutes):

```bash
eas build --platform ios --profile production
```

**What happens:**
- EAS builds your app on Expo's servers
- You'll be prompted to log in to your Apple Developer account
- EAS automatically handles code signing and provisioning profiles
- When complete, you'll get a download link for the `.ipa` file

### Step 6: Submit to TestFlight

Once the build completes, submit it to TestFlight:

```bash
eas submit --platform ios
```

**You'll be prompted for:**
- Apple ID (your developer account email)
- App-specific password (create one at [appleid.apple.com](https://appleid.apple.com))
- Apple Team ID (found in Apple Developer account)

**Alternative: Manual Submission**

If you prefer to submit manually:

1. Download the `.ipa` file from the EAS build page
2. Open **Transporter** app (comes with Xcode)
3. Drag and drop the `.ipa` file
4. Click **"Deliver"**

### Step 7: Configure TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** tab
3. Wait for processing (5-30 minutes)
4. Once processed, click on the build
5. Add **"What to Test"** notes for testers
6. If this is your first build, fill out **"Export Compliance"**:
   - For this app, answer **"No"** to encryption questions (or follow the wizard)

### Step 8: Add Testers

**Internal Testing** (up to 100 testers, instant access):
1. Go to **TestFlight** → **Internal Testing**
2. Click **"+"** next to Internal Testers
3. Add testers by email (they must have an Apple ID)

**External Testing** (up to 10,000 testers, requires Apple review):
1. Go to **TestFlight** → **External Testing**
2. Create a new group
3. Add testers by email or public link
4. Submit for Beta App Review (takes 24-48 hours)

### Step 9: Install TestFlight App

Testers need to:
1. Install **TestFlight** app from the App Store
2. Open the invitation email
3. Click **"View in TestFlight"**
4. Install your app

### Quick Deployment Script

You can use the included script for faster builds:

```bash
./build_and_publish
```

This script automatically:
- Builds for iOS
- Submits to TestFlight
- Handles common errors

## Updating Your TestFlight Build

To release a new version:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.2.0"
     }
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

3. Add "What's New" notes in App Store Connect

## Troubleshooting

### Build Fails

**Issue**: "Bundle identifier already exists"
- **Solution**: Change `bundleIdentifier` in `app.json` to something unique

**Issue**: "No provisioning profile found"
- **Solution**: Run `eas build:configure` and ensure you're logged into EAS and Apple Developer

**Issue**: "Invalid code signing"
- **Solution**: Let EAS manage certificates: `eas credentials` → Reset credentials

### Submission Fails

**Issue**: "Invalid App Store Connect API Key"
- **Solution**: Create an app-specific password at [appleid.apple.com](https://appleid.apple.com)

**Issue**: "Export compliance missing"
- **Solution**: In App Store Connect, go to TestFlight → Build → Export Compliance and complete the form

### TestFlight Processing Takes Forever

- Builds typically process in 5-30 minutes
- If stuck for >1 hour, check App Store Connect for error messages
- Check email for compliance issues from Apple

### App Crashes on TestFlight

- Check the version matches what you built
- Review crash logs in App Store Connect → TestFlight → Build → Crashes
- Test locally first with `npm run ios` before building

## Common Commands Reference

```bash
# Check EAS build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel

# Check submission status
eas submit:list

# Update credentials
eas credentials

# Clean build cache (if builds fail mysteriously)
eas build --clear-cache
```

## App Screens Overview

### 🏠 Home
- Portfolio dashboard showing all positions and balances
- Swipe between Perp, Spot, and Account views
- Quick access to starred markets with 24h volume
- One-tap position closing and fund transfers

### 🌐 Browser
- Built-in Web3-enabled browser
- Automatically connects your wallet to any dApp
- Seamless interaction with DeFi protocols
- Default: Hyperliquid web interface

### 🔍 Search
- Search all perpetual and spot markets
- Star/unstar favorite trading pairs
- View 24h price changes and volumes
- Quick navigation to chart screen

### 📊 Chart (Detail View)
- Advanced TradingView-style charting
- Multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- Live order book and recent trades
- Integrated order ticket (market, limit, stop orders)
- Position management with TP/SL
- Open orders with one-tap cancellation

### 📜 History
- Complete transaction ledger
- Filter by action type (trade, deposit, withdrawal, etc.)
- Detailed trade information with P&L
- Infinite scroll for full history

### 👤 Profile
- Wallet information and address
- Session key management
- Settings (auto-approve, cache clearing)
- Disconnect wallet option

## Architecture Highlights

### Context Providers
- **WalletContext**: Manages wallet connection, account state, and Hyperliquid clients
- **WebSocketContext**: Handles real-time market data subscriptions and updates

### Modular Components
- Each screen is self-contained with its own component directory
- Shared components promote reusability
- Separate style files for maintainability

### Performance Optimizations
- **Candle Caching**: SQLite database caches historical chart data
- **Memoization**: Heavy computations are memoized with `useMemo`
- **Lazy Loading**: Charts and heavy components load on-demand
- **Debouncing**: Input handlers are debounced to prevent excessive renders
- **WebSocket Management**: Automatic reconnection and subscription management

## Documentation

Additional documentation can be found in:
- `REFACTOR_PLAN.md` - Architecture refactoring details
- `REFACTORING_SUMMARY.md` - Summary of code improvements
- `MODULAR.md` - Modular architecture guidelines
- `TPSL_MODAL_REFACTOR_SUMMARY.md` - TP/SL modal implementation
- `.cursor/BACKLOG.md` - Feature backlog and TODOs

## License

MIT License - See [LICENSE.md](LICENSE.md) for details.

This project is open source and free to use, modify, and distribute. You may fork this project, modify it, and publish your own version.

## ⚠️ DISCLAIMER

**IMPORTANT: READ CAREFULLY BEFORE USING THIS SOFTWARE**

### Financial Risk Warning

This software is provided for educational and informational purposes only. Trading cryptocurrencies, perpetual contracts, and other digital assets involves substantial risk of loss and is not suitable for every investor. The valuation of cryptocurrencies and tokens may fluctuate, and, as a result, you may lose more than your original investment.

**By using this software, you acknowledge and agree that:**

1. **No Financial Advice**: This software does not provide financial, investment, trading, or other advice. Any decisions you make based on information provided by this software are your sole responsibility.

2. **Use at Your Own Risk**: You use this software entirely at your own risk. The developers and contributors of this software shall not be liable for any losses, damages, costs, or expenses incurred as a result of using this software.

3. **No Warranty**: This software is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.

4. **No Liability for Losses**: The developers, contributors, and anyone who deploys or distributes this code are NOT responsible for any funds gained or lost, trading decisions made, or financial outcomes resulting from the use of this software.

5. **Smart Contract Risks**: Interacting with blockchain protocols and smart contracts carries inherent risks including but not limited to smart contract bugs, protocol vulnerabilities, network congestion, and loss of private keys.

6. **Regulatory Compliance**: You are solely responsible for ensuring your use of this software complies with all applicable laws and regulations in your jurisdiction. Cryptocurrency trading and DeFi activities may be subject to licensing requirements, tax obligations, and other legal restrictions.

7. **Security Risks**: While security best practices have been followed, no software is completely secure. You are responsible for securing your device, private keys, and wallet credentials.

8. **Third-Party Services**: This software integrates with third-party services (Hyperliquid, WalletConnect, blockchain networks, etc.). The developers of this software are not responsible for the actions, security, or availability of these third-party services.

9. **No Guarantee of Availability**: This software may contain bugs, errors, or may become unavailable at any time. There is no guarantee of uptime, accuracy, or continued functionality.

10. **Personal Responsibility**: You are solely responsible for:
    - Conducting your own research before making any trading decisions
    - Understanding the risks involved in cryptocurrency trading
    - Securing your wallet and private keys
    - Complying with all applicable laws and regulations
    - Managing your own risk and position sizing
    - Any tax obligations resulting from your trading activity

### No Endorsement

This software is an independent, community-built project. It is not officially endorsed, affiliated with, or supported by Hyperliquid Labs, the Hyperliquid Foundation, or any other organization mentioned in this software.

### Modifications and Forks

Anyone who forks, modifies, or deploys this code assumes full responsibility for their version of the software and any consequences arising from its use. The original developers bear no responsibility for modifications made by third parties.

---

**BY USING THIS SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS DISCLAIMER. IF YOU DO NOT AGREE WITH THESE TERMS, DO NOT USE THIS SOFTWARE.**


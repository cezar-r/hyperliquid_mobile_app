# Hyperliquid Mobile Companion

A React Native mobile application for interacting with the Hyperliquid decentralized exchange.

## Features

- Wallet connectivity via WalletConnect
- Real-time price feeds and orderbook data
- Perpetual and spot trading
- Portfolio management and analytics
- Deposits and withdrawals
- Staking functionality
- Historical charts with OHLC candles

## Tech Stack

- **Framework**: Expo + React Native + TypeScript
- **Wallet**: WalletConnect + viem
- **Blockchain**: Hyperliquid L1 (via @nktkas/hyperliquid SDK)
- **Charts**: react-native-wagmi-charts
- **State**: React Context + Hooks
- **Storage**: AsyncStorage + SecureStore

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (macOS) or Android Studio

### Installation

```bash
npm install
```

### Running the App

```bash
# Start development server
npx expo start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Environment Configuration

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_HL_ENV=testnet
# EXPO_PUBLIC_HL_API_URL=  # Optional override
```

## Project Structure

```
src/
├── screens/        # App screens and pages
├── components/     # Reusable UI components
├── contexts/       # React contexts (wallet, websocket)
├── hooks/          # Custom React hooks
├── lib/            # SDK wiring, utilities, formatters
├── services/       # API wrappers
├── styles/         # Color palette
├── theme/          # Typography, spacing, theme tokens
├── types/          # TypeScript type definitions
├── constants/      # App constants
├── navigation/     # Navigation configuration
└── features/       # Domain-specific feature modules
```

## Development

### Code Style

- Follow guidelines in `CODE_STYLE.md`
- Lines should not exceed 100 characters
- Use TypeScript strict mode
- Prefer named exports over default exports

### Linting and Formatting

```bash
npm run lint
npm run format
```

## Building and Publishing

Use the `build_and_publish` script to build and submit to TestFlight:

```bash
./build_and_publish
```

Or manually with EAS:

```bash
eas build --platform ios
eas submit --platform ios
```

## Documentation

- `.cursor/REQUIREMENTS.md` - Project requirements
- `.cursor/MILESTONES.md` - Development milestones
- `.cursor/DOCS.md` - API and SDK documentation
- `CODE_STYLE.md` - Code style guidelines

## License

Private - All Rights Reserved


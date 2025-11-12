# Technology Stack

This document details all the technologies, frameworks, libraries, and tools used in the Hyperliquid Mobile Companion app.

## Frontend

### Framework
- **Expo SDK 54**: Cross-platform React Native framework with managed workflow
- **React Native 0.81.4**: Core mobile framework for iOS and Android
- **TypeScript 5.9**: Statically typed JavaScript with strict mode enabled
- **React 19.1.0**: UI library for component-based architecture

### Navigation
- **React Navigation 7**: Primary navigation library
  - `@react-navigation/bottom-tabs` (v7.4.8): Tab navigation
  - `@react-navigation/native` (v7.1.18): Core navigation primitives
  - `@react-navigation/native-stack` (v7.3.27): Native stack navigator
- **React Native Screens** (v4.16.0): Native screen container optimization
- **React Native Safe Area Context** (v5.6.1): Safe area handling for notched devices

### UI Components
- **Custom Components**: All UI components built from scratch for full control
- **React Native Reanimated** (v4.1.2): High-performance animations
- **React Native Gesture Handler** (v2.28.0): Native gesture recognition
- **React Native Worklets** (v0.5.1): Runs animations on UI thread
- **React Native SVG** (v15.12.1): SVG rendering support

### Charts
- **Lightweight Charts**: TradingView's charting library (via WebView bridge)
- **react-native-wagmi-charts** (v2.7.3): Financial charts for balance trends
- **WebView Bridge**: Custom implementation for chart interaction

### Icons & Assets
- **Expo Vector Icons** (v15.0.2): Icon library with multiple families
  - MaterialCommunityIcons
  - Ionicons
  - MaterialIcons
- **Expo Font** (v14.0.8): Custom font loading (Teodor family)
- **Expo Linear Gradient** (v15.0.7): Gradient backgrounds

### Animations
- **React Native Reanimated** (v4.1.2): Declarative animations API
- **React Native Animated API**: Built-in animation system
- **Custom Animation Hooks**: Reusable animation utilities

## Blockchain & Web3

### Wallet Connection
- **Reown AppKit** (v2.0.1): Modern WalletConnect v2 integration (formerly WalletConnect)
  - `@reown/appkit-react-native` (v2.0.1)
  - `@reown/appkit-ethers-react-native` (v2.0.1)
- **@walletconnect/react-native-compat** (v2.23.0): React Native compatibility layer
- **Ethers.js**: Ethereum library via Reown AppKit adapters

### Chain Support
- **viem** (v2.38.0): Lightweight Ethereum library for type-safe interactions
  - Chain definitions for Ethereum Mainnet and Arbitrum
  - Typed data signing (EIP-712)
  - Transaction formatting

### Hyperliquid Integration
- **@nktkas/hyperliquid** (v0.25.1): Official Hyperliquid SDK
  - InfoClient: Market data and account info
  - ExchangeClient: Order placement and trading
  - SubscriptionClient: WebSocket subscriptions
  - HTTP & WebSocket transports

### Web3 Provider
- **Custom EIP-1193 Provider**: Built for dApp browser
  - MetaMask compatibility layer
  - EIP-6963 multi-provider discovery
  - RPC method bridging
  - Request/response handling

### Transaction Signing
- **viem**: Typed data signing (EIP-712)
- **Ethers.js**: Legacy signing methods
- **Session Keys**: Hyperliquid-specific gasless signing

## Data & State Management

### State Management
- **React Context API**: Global state management
  - WalletContext: Wallet and account state
  - WebSocketContext: Real-time market data
- **React Hooks**: Component-level state
  - useState, useEffect, useCallback, useMemo, useRef
- **Custom Hooks**: Reusable stateful logic

### WebSocket
- **Native WebSocket API**: Real-time connections
- **@nktkas/hyperliquid WebSocketTransport**: Managed WebSocket client
- **Auto-Reconnection**: Automatic reconnection on disconnect
- **Resubscription**: Automatic resubscription after reconnect

### Local Storage
- **@react-native-async-storage/async-storage** (v2.2.0): Persistent key-value storage
  - User preferences
  - Market filter selections
  - Starred tickers
  - Cache timestamps
- **Expo SecureStore** (v15.0.7): Encrypted storage for sensitive data
  - Session keys
  - Wallet credentials
  - Private data

### Database
- **Expo SQLite** (v16.0.9): Local SQL database
  - Candle data caching
  - Historical data storage
  - Query optimization

### Network Monitoring
- **@react-native-community/netinfo** (v11.4.1): Network connectivity detection
  - Online/offline status
  - Connection type detection
  - Network reachability

## UI/UX Libraries

### Forms & Inputs
- **TextInput**: React Native built-in
- **@react-native-picker/picker** (v2.7.5): Native picker component
- **react-native-dropdown-picker** (v5.4.6): Dropdown select component
- **@react-native-community/slider** (v5.0.1): Slider input

### Utilities
- **Expo Clipboard** (v8.0.7): Clipboard access
- **Expo Haptics** (v15.0.7): Haptic feedback
- **Expo Application** (v7.0.7): App metadata
- **Expo Status Bar** (v3.0.8): Status bar control
- **Expo Splash Screen** (v31.0.10): Splash screen management

### Media
- **Expo AV** (v16.0.7): Audio and video playback
- **react-native-webview** (v13.12.5): WebView component for browser and charts

## Polyfills & Compatibility

### Crypto & Encoding
- **buffer** (v6.0.3): Node.js Buffer polyfill
- **react-native-get-random-values** (v1.11.0): Crypto.getRandomValues polyfill
- **react-native-url-polyfill** (v3.0.0): URL and URLSearchParams polyfills

### Environment
- **react-native-dotenv** (v3.4.11): Environment variable loading
- **@env**: Type definitions for environment variables

## Development Tools

### Build System
- **Expo Application Services (EAS)**: Cloud build and submission
  - iOS builds on EAS servers
  - Android builds on EAS servers
  - Automatic code signing
  - TestFlight/Play Store submission

### Linting
- **ESLint** (v9.37.0): JavaScript/TypeScript linter
- **@typescript-eslint/eslint-plugin** (v8.46.0): TypeScript-specific rules
- **@typescript-eslint/parser** (v8.46.0): TypeScript parser for ESLint
- **eslint-plugin-react** (v7.37.5): React-specific linting rules
- **eslint-plugin-react-hooks** (v7.0.0): React Hooks linting rules

### Formatting
- **Prettier** (v3.6.2): Code formatter
  - Automatic code formatting
  - Integration with ESLint
  - Pre-commit hooks support

### Type Checking
- **TypeScript** (v5.9.2): Static type checker
  - Strict mode enabled
  - Full type coverage
  - JSX support

### Build Configuration
- **Babel**: JavaScript compiler
  - `babel-preset-expo` (v54.0.3): Expo-specific Babel preset
- **Metro**: React Native bundler (via Expo)
- **expo-build-properties** (v1.0.9): Native build configuration
  - iOS: Static frameworks
  - Android: Edge-to-edge support

### Testing
- **Expo DevTools**: Built-in development tools
- **React DevTools**: Component inspection (via Expo)
- **Network Inspector**: Network request debugging

## Platform-Specific

### iOS
- **Xcode**: Required for iOS builds
- **CocoaPods**: Dependency management (Podfile)
- **Swift**: Native module bridging
- **Static Frameworks**: iOS linking strategy

### Android
- **Android Studio**: Required for Android builds
- **Gradle**: Build system
- **Kotlin**: Native module bridging
- **Edge-to-Edge**: Modern Android UI

## Version Management

All major dependencies are locked to specific versions to ensure stability:
- Expo SDK: ~54.0.12
- React Native: 0.81.4
- React: 19.1.0
- TypeScript: ~5.9.2

See [package.json](../package.json) for the complete list of dependencies with exact versions.

## Architecture Decisions

### Why Expo?
- Managed workflow simplifies development
- EAS handles complex build configurations
- Over-the-air updates capability
- Excellent documentation and community

### Why React Navigation?
- Most mature navigation library for React Native
- Native performance on iOS and Android
- Extensive customization options
- Strong TypeScript support

### Why Reown AppKit (WalletConnect)?
- Industry standard for mobile wallet connections
- Supports 40+ wallets out of the box
- Secure connection protocol
- Active development and support

### Why viem over ethers.js?
- Smaller bundle size
- Better TypeScript support
- Modern API design
- Type-safe contract interactions

### Why SQLite for caching?
- Native performance
- Structured queries
- ACID compliance
- Offline-first support

---

For implementation details and architecture patterns, see [ARCHITECTURE_HIGHLIGHTS.md](./ARCHITECTURE_HIGHLIGHTS.md).


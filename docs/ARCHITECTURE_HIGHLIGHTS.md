# Architecture Highlights

This document explains the key architectural patterns, design decisions, and technical implementations in the Hyperliquid Mobile Companion app.

## Overview

The app follows a modern React Native architecture with:
- **Context-based state management**
- **Modular component structure**
- **Separation of concerns**
- **Performance-first approach**
- **Type-safe TypeScript throughout**

## Core Architecture Patterns

### 1. Context Providers

The app uses React Context API for global state management, avoiding the complexity of Redux while maintaining clean data flow.

#### WalletContext

**Responsibility**: Manages wallet connection and account state

**Provides:**
```typescript
{
  address: string | undefined;              // Connected wallet address
  account: Account | null;                  // Full account data
  refetchAccount: () => Promise<void>;      // Reload account data
  exchangeClient: ExchangeClient | null;    // SDK client for trading
  infoClient: InfoClient | null;            // SDK client for market data
  hasSessionKey: boolean;                   // Session key status
}
```

**Key Features:**
- Automatic account polling (every 5 seconds)
- Lazy initialization of SDK clients
- Session key management integration
- Clean disconnect/reconnect handling

**Usage Pattern:**
```typescript
function MyComponent() {
  const { account, exchangeClient, refetchAccount } = useWallet();
  
  const placeOrder = async () => {
    if (!exchangeClient) return;
    await exchangeClient.placeOrder(...);
    await refetchAccount(); // Refresh account after trade
  };
}
```

#### WebSocketContext

**Responsibility**: Manages real-time market data streams

**Provides:**
```typescript
{
  state: {
    selectedCoin: string;
    marketType: 'perp' | 'spot';
    currentPrice: string;
    orderBook: OrderBook;
    recentTrades: Trade[];
  };
  selectCoin: (coin: string) => void;
  setMarketType: (type: 'perp' | 'spot') => void;
  infoClient: InfoClient;
}
```

**Key Features:**
- Automatic subscription management
- Auto-reconnection on disconnect
- Resubscription after reconnect
- Efficient update batching

**Subscription Flow:**
```
User selects coin → Context subscribes to WebSocket
↓
Hyperliquid sends updates → Context updates state
↓
Components re-render with new data
```

### 2. Modular Component Structure

Each screen is self-contained with its own directory:

```
home_screen/
├── HomeScreen.tsx          # Main component
├── components/             # Screen-specific components
│   ├── BalanceContent.tsx
│   ├── PerpPositionsContainer.tsx
│   └── ...
└── styles/                 # Screen-specific styles
    ├── HomeScreen.styles.ts
    └── ...
```

**Benefits:**
- **Encapsulation**: Each screen owns its logic and components
- **Reusability**: Shared components live in `shared/`
- **Maintainability**: Easy to locate and modify code
- **Testing**: Components can be tested in isolation

### 3. Separation of Concerns

#### Component Responsibilities

**Screens** (`src/ui/screens/`)
- Orchestrate data fetching
- Handle navigation
- Compose child components
- Manage screen-level state

**Components** (`components/` subdirectories)
- Render UI elements
- Handle user interactions
- Delegate business logic to parent

**Contexts** (`src/contexts/`)
- Manage global state
- Handle SDK interactions
- Provide data to components

**Utilities** (`src/lib/`)
- Pure functions
- SDK wrappers
- Formatters and calculators
- No React dependencies

#### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Context Method Call
    ↓
SDK API Call
    ↓
Context State Update
    ↓
Component Re-render
```

## Performance Optimizations

### 1. Candle Caching

**Problem**: Fetching historical candle data is slow and expensive.

**Solution**: SQLite database caches candles locally.

**Implementation:**
```typescript
// lib/candleCache.ts
export async function getCachedCandles(
  coin: string,
  interval: CandleInterval,
  startTime: number,
  endTime: number
): Promise<Candle[]> {
  // 1. Check SQLite cache
  const cached = await queryCandlesFromDB(...);
  if (cached.length > 0) return cached;
  
  // 2. Fetch from API if cache miss
  const fresh = await fetchCandlesFromAPI(...);
  
  // 3. Store in cache for future
  await storeCandlesInDB(fresh);
  
  return fresh;
}
```

**Benefits:**
- Instant chart loading for viewed markets
- Reduced API calls
- Works offline for cached data
- Automatic cache invalidation

### 2. Memoization

Heavy computations are memoized with `useMemo`:

```typescript
const formattedPositions = useMemo(() => {
  return positions.map(pos => ({
    ...pos,
    formattedPrice: formatPrice(pos.entryPx, market.szDecimals),
    pnl: calculatePnL(pos, currentPrice),
    // ... expensive calculations
  }));
}, [positions, currentPrice, market]);
```

**Benefits:**
- Calculations only run when dependencies change
- Reduces re-render time
- Smooth scrolling in lists

### 3. Lazy Loading

Charts and heavy components load on-demand:

```typescript
const ChartContent = React.lazy(() => import('./ChartContent'));

function ChartScreen() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <ChartContent />
    </Suspense>
  );
}
```

**Benefits:**
- Faster initial load
- Smaller bundle size
- Better memory usage

### 4. Debouncing

Input handlers are debounced to prevent excessive renders:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useMemo(
  () => debounce(setSearchTerm, 300),
  []
);

// User types → debounce → state updates → search executes
```

### 5. WebSocket Management

Efficient subscription handling:

```typescript
class WebSocketManager {
  // Only one connection for all subscriptions
  private connection: WebSocket;
  
  // Batch updates to reduce re-renders
  private updateQueue: Update[] = [];
  
  // Auto-reconnect with exponential backoff
  private reconnect() {
    const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
    setTimeout(() => this.connect(), delay);
  }
  
  // Resubscribe to all active subscriptions
  private resubscribe() {
    this.activeSubscriptions.forEach(sub => {
      this.subscribe(sub.channel, sub.params);
    });
  }
}
```

## Advanced Features Implementation

### 1. Integrated dApp Browser

**Challenge**: Make connected wallet available to web dApps.

**Solution**: Inject EIP-1193-compliant Ethereum provider into WebView.

**Architecture:**
```
WebView (dApp)
    ↓ window.ethereum.request()
    ↓ postMessage()
React Native
    ↓ Bridge request to WalletConnect
    ↓ WalletConnect modal
User's Wallet App
    ↓ User signs
React Native
    ↓ postMessage(result)
WebView (dApp)
    ↓ Receives result
```

**Key Code:**
```typescript
// Injected into WebView
window.ethereum = {
  request: async ({ method, params }) => {
    // Bridge to React Native
    return new Promise((resolve, reject) => {
      const id = requestId++;
      pendingRequests.set(id, { resolve, reject });
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'eth_request', id, method, params })
      );
    });
  },
  // ... other methods
};

// EIP-6963 announcement
window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
  detail: {
    info: { name: 'MetaMask', uuid: 'io.metamask' },
    provider: window.ethereum
  }
}));
```

### 2. Session Keys

**Challenge**: Signing every order is slow and interrupts trading flow.

**Solution**: Temporary keys stored securely on device.

**Flow:**
```
1. User enables session keys
    ↓
2. App generates ephemeral key pair
    ↓
3. User signs message authorizing the key
    ↓
4. Private key stored in SecureStore
    ↓
5. Orders signed locally with session key
    ↓
6. No wallet approval needed for trades
```

**Security:**
- Keys stored in OS secure storage (Keychain/Keystore)
- Keys expire after configured period
- Can be revoked at any time
- Separate key per device

**Implementation:**
```typescript
// lib/sessionKey.ts
export async function createSessionKey(): Promise<string> {
  // 1. Generate key pair
  const wallet = ethers.Wallet.createRandom();
  
  // 2. User signs authorization
  const signature = await userWallet.signMessage(authMessage);
  
  // 3. Store in secure storage
  await SecureStore.setItemAsync('session_key', wallet.privateKey);
  
  return wallet.address;
}

export async function signWithSessionKey(message: string): Promise<string> {
  const key = await SecureStore.getItemAsync('session_key');
  const wallet = new ethers.Wallet(key);
  return wallet.signMessage(message);
}
```

### 3. Real-Time Price Updates

**Challenge**: Display live prices without overwhelming the UI.

**Solution**: Batched updates with throttling.

**Implementation:**
```typescript
class PriceUpdateManager {
  private updateQueue: Map<string, number> = new Map();
  private isProcessing = false;
  
  queueUpdate(coin: string, price: number) {
    this.updateQueue.set(coin, price);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  private async processQueue() {
    this.isProcessing = true;
    
    // Batch all pending updates
    const updates = Array.from(this.updateQueue.entries());
    this.updateQueue.clear();
    
    // Single state update for all prices
    setState(prevState => ({
      ...prevState,
      prices: { ...prevState.prices, ...Object.fromEntries(updates) }
    }));
    
    // Wait before next batch
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isProcessing = false;
    
    // Process any new updates that came in
    if (this.updateQueue.size > 0) {
      this.processQueue();
    }
  }
}
```

## Error Handling Strategy

### Graceful Degradation

```typescript
try {
  const account = await fetchAccount();
  return <AccountView account={account} />;
} catch (error) {
  console.error('Failed to fetch account:', error);
  return <ErrorState onRetry={refetch} />;
}
```

### User-Friendly Messages

```typescript
function handleError(error: any) {
  let message = 'An unexpected error occurred';
  
  if (error.code === 'NETWORK_ERROR') {
    message = 'Network connection lost. Please check your internet.';
  } else if (error.code === 'INSUFFICIENT_BALANCE') {
    message = 'Insufficient balance for this transaction.';
  }
  
  Alert.alert('Error', message);
}
```

### Automatic Recovery

```typescript
class ResilientWebSocket {
  connect() {
    this.ws = new WebSocket(url);
    
    this.ws.onerror = () => {
      console.error('WebSocket error');
      this.reconnect();
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.reconnect();
    };
  }
  
  reconnect() {
    setTimeout(() => this.connect(), this.backoffDelay);
    this.backoffDelay = Math.min(this.backoffDelay * 2, 30000);
  }
}
```

## Type Safety

### Strict TypeScript

All code uses TypeScript with strict mode:
- No implicit `any`
- Null checks required
- Unused variables flagged
- Return types enforced

### Type Definitions

Centralized type definitions in `src/types/index.ts`:

```typescript
export interface PerpPosition {
  coin: string;
  szi: string;          // Size (+ for long, - for short)
  entryPx: string;      // Entry price
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string | null;
  leverage: number;
  marginUsed: string;
}

export type MarketType = 'perp' | 'spot';
export type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';
export type OrderSide = 'buy' | 'sell';
```

### SDK Type Integration

Hyperliquid SDK provides full TypeScript types:

```typescript
import * as hl from '@nktkas/hyperliquid';

const client = new hl.ExchangeClient({ wallet });

// All methods are fully typed
const result: hl.PlaceOrderResult = await client.placeOrder({
  coin: 'BTC',
  is_buy: true,
  sz: 0.1,
  limit_px: 50000,
  order_type: { limit: { tif: 'Gtc' } },
  reduce_only: false,
});
```

## Testing Strategy

### Manual Testing Checklist

Before each release:
- ✅ Test on iOS device
- ✅ Test on Android device
- ✅ Test all screens and navigation
- ✅ Test order placement and cancellation
- ✅ Test deposits and withdrawals
- ✅ Test browser with multiple dApps
- ✅ Test WebSocket reconnection
- ✅ Test offline behavior
- ✅ Test error states

### Development Testing

During development:
```bash
# Run linter
npm run lint

# Run type checker
npm run type-check

# Format code
npm run format

# Test on simulator
npm run ios
npm run android
```

## Future Architecture Improvements

### Planned Enhancements

1. **State Management Evolution**
   - Consider Zustand or Jotai for more complex state
   - Add Redux DevTools support
   - Implement time-travel debugging

2. **Offline-First Architecture**
   - Queue transactions for offline execution
   - Sync when connection restored
   - Optimistic UI updates

3. **Performance Monitoring**
   - Add performance metrics
   - Track render times
   - Monitor memory usage
   - Crash reporting integration

4. **Testing Infrastructure**
   - Unit tests with Jest
   - Integration tests with Detox
   - E2E test automation
   - Visual regression testing

5. **Code Splitting**
   - Lazy load screens
   - Split large modals
   - Dynamic imports for heavy features

---

For more implementation details, see the source code in `src/` and related documentation:
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Code organization
- [CODE_STYLE.md](./CODE_STYLE.md) - Coding conventions
- [FEATURES.md](./FEATURES.md) - Feature descriptions


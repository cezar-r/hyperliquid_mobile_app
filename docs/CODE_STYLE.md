# Code Style Guide

This document outlines the coding standards and style conventions for the Hyperliquid Mobile Companion project.

## General Principles

### 1. Consistency
- Follow existing patterns in the codebase
- When in doubt, match the style of surrounding code
- Use automated tools (ESLint, Prettier) to enforce consistency

### 2. Readability
- Code should be self-documenting
- Use descriptive variable and function names
- Add comments only when the "why" isn't obvious from the code
- Prefer clarity over cleverness

### 3. Maintainability
- Keep functions small and focused
- Avoid deep nesting
- Extract complex logic into named functions
- Use TypeScript for type safety

## TypeScript

### Strict Mode
- TypeScript strict mode is **enabled**
- All code must pass type checking without errors
- Avoid `any` type unless absolutely necessary
- Use explicit return types for functions

```typescript
// ✅ Good
function formatPrice(price: number, decimals: number): string {
  return price.toFixed(decimals);
}

// ❌ Bad
function formatPrice(price: any, decimals) {
  return price.toFixed(decimals);
}
```

### Type Definitions
- Define types in `src/types/index.ts` for shared types
- Use interfaces for object shapes
- Use type aliases for unions and primitives

```typescript
// ✅ Good
interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  leverage: number;
}

type MarketType = 'perp' | 'spot';

// ❌ Bad
type Position = {
  coin: string;
  szi: string;
  entryPx: string;
  leverage: number;
};
```

### Null Safety
- Use optional chaining (`?.`) for potentially undefined values
- Use nullish coalescing (`??`) for default values
- Avoid non-null assertions (`!`) unless absolutely certain

```typescript
// ✅ Good
const balance = account?.marginSummary?.accountValue ?? '0';

// ❌ Bad
const balance = account.marginSummary.accountValue || '0';
```

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (e.g., `HomeScreen.tsx`, `BalanceContent.tsx`)
- **Utilities**: camelCase (e.g., `formatting.ts`, `sessionKey.ts`)
- **Styles**: Match component name with `.styles.ts` (e.g., `HomeScreen.styles.ts`)
- **Types**: camelCase (e.g., `index.ts`)
- **Directories**: snake_case (e.g., `home_screen/`, `order_ticket/`)

### Variables and Functions
- **Variables**: camelCase (e.g., `accountValue`, `currentPrice`)
- **Functions**: camelCase (e.g., `formatPrice`, `closePosition`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_LEVERAGE`, `DEFAULT_URL`)
- **Components**: PascalCase (e.g., `HomeScreen`, `BalanceContent`)
- **Booleans**: Prefix with `is`, `has`, `should` (e.g., `isLoading`, `hasSessionKey`)

```typescript
// ✅ Good
const MARKET_FILTER_KEY = 'hl_home_market_filter';
const isLoading = true;
const currentPrice = 50000;

function calculatePnL(position: Position): number {
  // ...
}

// ❌ Bad
const marketFilterKey = 'hl_home_market_filter';
const loading = true;
const price = 50000;

function calc_pnl(position: Position): number {
  // ...
}
```

### React Components
- Use function components (not class components)
- Name components after their primary purpose
- Suffix screen components with `Screen`
- Suffix modal components with `Modal`
- Suffix container components with `Container`

```typescript
// ✅ Good
export default function HomeScreen(): React.JSX.Element {
  return <View>...</View>;
}

export function BalanceContent(): React.JSX.Element {
  return <View>...</View>;
}

// ❌ Bad
export default function Home() {
  return <View>...</View>;
}

function balance_content() {
  return <View>...</View>;
}
```

## Code Structure

### Line Length
- **Maximum 100 characters per line**
- Break long lines at logical points
- Indent continuation lines

```typescript
// ✅ Good
const formattedPrice = formatPrice(
  parseFloat(position.entryPx),
  market.szDecimals,
  true
);

// ❌ Bad
const formattedPrice = formatPrice(parseFloat(position.entryPx), market.szDecimals, true);
```

### Imports
Order imports as follows:
1. React and React Native
2. Third-party libraries
3. Contexts
4. Lib/utilities
5. Components
6. Types
7. Styles

Leave a blank line between groups.

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { useWallet } from '../../../contexts/WalletContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';

import { formatPrice, formatSize } from '../../../lib/formatting';
import { playHaptic } from '../../../lib/haptics';

import { BalanceContent, PerpPositionsContainer } from './components';
import { PanelSelector } from '../../shared/components';

import type { PerpPosition, MarketType } from '../../../types';

import { styles } from './styles/HomeScreen.styles';
```

### Exports
- **Prefer named exports over default exports**
- Use default exports only for screen components
- Create barrel exports (`index.ts`) for directories with multiple exports

```typescript
// ✅ Good - Named exports
export function formatPrice(price: number): string { ... }
export function formatSize(size: number): string { ... }

// component/index.ts
export { BalanceContent } from './BalanceContent';
export { PerpPositionsContainer } from './PerpPositionsContainer';

// ❌ Bad - Multiple default exports
export default function formatPrice(price: number): string { ... }
export default function formatSize(size: number): string { ... }
```

## React Best Practices

### Hooks
- Always use hooks at the top level (not in conditionals or loops)
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Use `useRef` for values that don't trigger re-renders

```typescript
// ✅ Good
export default function MyComponent(): React.JSX.Element {
  const [count, setCount] = useState(0);
  const previousCount = useRef(0);
  
  const handlePress = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const expensiveValue = useMemo(() => {
    return heavyComputation(count);
  }, [count]);
  
  return <View>...</View>;
}

// ❌ Bad
export default function MyComponent(): React.JSX.Element {
  const [count, setCount] = useState(0);
  
  if (count > 0) {
    const previousCount = useRef(0); // ❌ Conditional hook
  }
  
  const handlePress = () => {
    setCount(c => c + 1); // ❌ Not memoized
  };
  
  const expensiveValue = heavyComputation(count); // ❌ Runs every render
  
  return <View>...</View>;
}
```

### Component Structure
Follow this order within components:
1. Props interface/type
2. Component function declaration
3. Context hooks
4. State hooks
5. Ref hooks
6. Effect hooks
7. Memoized values
8. Callback functions
9. Render helpers
10. Return statement

```typescript
interface MyComponentProps {
  userId: string;
  onPress: () => void;
}

export function MyComponent({ userId, onPress }: MyComponentProps): React.JSX.Element {
  // 1. Context hooks
  const { account } = useWallet();
  const navigation = useNavigation();
  
  // 2. State hooks
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  
  // 3. Ref hooks
  const isMounted = useRef(true);
  
  // 4. Effect hooks
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // 5. Memoized values
  const formattedData = useMemo(() => {
    return formatData(data);
  }, [data]);
  
  // 6. Callback functions
  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    // ...
    setIsLoading(false);
  }, []);
  
  // 7. Render helpers
  const renderItem = (item: Item) => {
    return <Text>{item.name}</Text>;
  };
  
  // 8. Return
  return (
    <View>
      {/* ... */}
    </View>
  );
}
```

### JSX
- Use self-closing tags when there are no children
- Use parentheses for multi-line JSX
- Keep JSX simple; extract complex logic into functions

```typescript
// ✅ Good
return (
  <View style={styles.container}>
    <Text style={styles.title}>Hello</Text>
    <TouchableOpacity onPress={handlePress} />
  </View>
);

// ❌ Bad
return <View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
  <TouchableOpacity onPress={handlePress}></TouchableOpacity>
</View>;
```

## Styling

### Style Files
- Keep styles in separate `.styles.ts` files
- Use `StyleSheet.create()` for performance
- Group related styles together
- Use constants for colors and sizes

```typescript
// HomeScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Color } from '../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Color.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.FG_1,
  },
});
```

### Style Naming
- Use descriptive names that indicate purpose
- Avoid generic names like `container1`, `text2`
- Use camelCase for style names

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: { ... },
  headerContainer: { ... },
  titleText: { ... },
  subtitleText: { ... },
  actionButton: { ... },
});

// ❌ Bad
const styles = StyleSheet.create({
  container: { ... },
  container2: { ... },
  text: { ... },
  text1: { ... },
  btn: { ... },
});
```

## Error Handling

### Try-Catch
- Use try-catch for async operations
- Log errors appropriately
- Show user-friendly error messages

```typescript
// ✅ Good
try {
  const result = await exchangeClient.placeOrder(order);
  console.log('✅ Order placed:', result);
  Alert.alert('Success', 'Order placed successfully');
} catch (error) {
  console.error('❌ Order failed:', error);
  Alert.alert('Error', 'Failed to place order. Please try again.');
}

// ❌ Bad
const result = await exchangeClient.placeOrder(order); // No error handling
```

### Null Checks
- Check for null/undefined before accessing properties
- Provide sensible defaults

```typescript
// ✅ Good
const balance = account?.marginSummary?.accountValue ?? '0';
if (!account) {
  return <EmptyState message="No account data" />;
}

// ❌ Bad
const balance = account.marginSummary.accountValue;
```

## Comments

### When to Comment
- **DO**: Explain complex algorithms or business logic
- **DO**: Document non-obvious workarounds
- **DO**: Add TODO comments for future improvements
- **DON'T**: Comment obvious code
- **DON'T**: Leave commented-out code

```typescript
// ✅ Good
// Calculate PnL using entry price and current mark price
// Formula: position_size * (mark_price - entry_price)
const pnl = positionSize * (markPrice - entryPrice);

// TODO: Add support for cross-margin positions
const leverage = position.leverage;

// ❌ Bad
// Set the count to 0
const count = 0;

// Old implementation
// const oldPnl = position.unrealizedPnl;
```

### Comment Style
- Use `//` for single-line comments
- Use `/** */` for JSDoc comments on functions
- Start comments with a capital letter
- End comments with a period for full sentences

```typescript
/**
 * Formats a price value for display based on market decimals.
 * 
 * @param price - The raw price value
 * @param decimals - Number of decimal places
 * @returns Formatted price string
 */
export function formatPrice(price: number, decimals: number): string {
  // ...
}
```

## Testing

### Manual Testing
- Test on both iOS and Android before committing
- Test edge cases (empty states, errors, loading)
- Test different screen sizes

### Console Logging
- Use descriptive log messages with emojis
- Remove debug logs before committing production code
- Use `logger.ts` for structured logging

```typescript
// ✅ Good
console.log('✅ Order placed successfully:', orderId);
console.error('❌ Failed to fetch account:', error);
logApiCall('fetchAccount', { userId });

// ❌ Bad
console.log('success');
console.log(orderId);
```

## Performance

### Optimization
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive computations
- Use `useCallback()` for stable function references
- Avoid anonymous functions in render
- Optimize images (compress, use appropriate sizes)

```typescript
// ✅ Good
const MemoizedComponent = React.memo(MyComponent);

const handlePress = useCallback(() => {
  // ...
}, [dependencies]);

// ❌ Bad
<TouchableOpacity onPress={() => handlePress()} />
```

### Lists
- Always provide a `key` prop for list items
- Use `FlatList` or `SectionList` for long lists
- Implement `getItemLayout` for fixed-height items

## Git Workflow

### Commits
- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable

### Branching
- Create feature branches from `master`
- Use descriptive branch names
- Delete branches after merging

## Tools

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Type Checking
```bash
npm run type-check
```

Run these commands before committing to ensure code quality.

---

Following these guidelines will help maintain a consistent, readable, and maintainable codebase. When in doubt, refer to existing code for examples or ask for clarification.


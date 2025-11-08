# Codebase Refactoring Plan

## Overview

This plan outlines a systematic refactoring approach to transform the Hyperliquid Mobile Companion app into a professional-grade, production-ready codebase. The refactoring will be done incrementally to ensure no functionality is broken.

## Current State Analysis

### Key Issues Identified:

1. **Duplicate color definitions**: `src/styles/colors.ts` and `styles/colors.ts` exist with slight differences
2. **Repetitive formatting functions**: `formatPrice`, `formatNumber`, `formatPercent`, `formatLargeNumber` duplicated across 6+ files
3. **Magic numbers**: Hardcoded values (16, 20, 30, 52, 500, 100, 0.999, 1.001, etc.) throughout codebase
4. **Repetitive UI patterns**: Modal structures, button patterns, position cells, filter selectors duplicated
5. **Hardcoded colors**: Values like `'#0b0f13'`, `'rgba(0, 0, 0, 0.9)'` in styles
6. **Repetitive calculations**: PnL calculations, price change calculations repeated
7. **Inconsistent style organization**: Mix of spacing tokens and magic numbers
8. **No shared UI primitives**: Missing Button, Text, Card, Modal, Skeleton components

## Target Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Shared UI primitives
│   │   ├── Button.tsx
│   │   ├── Text.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts
│   ├── [existing components]
│   └── styles/
├── screens/             # Screen components
│   └── styles/
├── lib/                 # Utility functions
│   ├── formatting/      # All formatting utilities
│   ├── calculations/    # Business logic calculations
│   └── [existing libs]
├── theme/               # Design tokens
│   ├── colors.ts        # Unified color system
│   ├── spacing.ts       # Spacing tokens
│   ├── typography.ts    # Typography tokens
│   ├── animations.ts    # Animation constants
│   ├── numbers.ts       # Numeric constants
│   └── index.ts
├── types/               # TypeScript types
│   └── index.ts
└── constants/           # App constants
```

---

## Phase 1: Foundation - Design Tokens & Constants

### Step 1.1: Consolidate Color System

**Files to modify:**

- `src/styles/colors.ts` (keep this one)
- `styles/colors.ts` (delete after migration)

**Actions:**

1. Compare both color files and merge differences
2. Add missing colors from root `styles/colors.ts` to `src/styles/colors.ts` (GOLD, PURPLE)
3. Update all imports from `styles/colors` to `src/styles/colors`
4. Search for hardcoded color values and replace with Color enum:

   - `'#0b0f13'` → `Color.BG_4` (add to enum)
   - `'rgba(0, 0, 0, 0.9)'` → `Color.MODAL_OVERLAY` (add to enum)
   - Any other hardcoded hex colors found

5. Delete `styles/colors.ts`
6. Run tests to ensure no broken imports

**Verification:**

- No imports from `styles/colors`
- All hardcoded colors replaced
- Color enum includes all needed values

### Step 1.2: Create Numeric Constants File

**New file:** `src/theme/numbers.ts`

**Actions:**

1. Extract all magic numbers into named constants:
   ```typescript
   export const NUMERIC_CONSTANTS = {
     // Animation durations
     ANIMATION_DURATION_SHORT: 150,
     ANIMATION_DURATION_MEDIUM: 250,
     ANIMATION_DURATION_LONG: 500,
     
     // Slippage multipliers
     SLIPPAGE_BUY_MULTIPLIER: 0.999,
     SLIPPAGE_SELL_MULTIPLIER: 1.001,
     
     // Rounding
     DECIMAL_PLACES_DEFAULT: 2,
     DECIMAL_PLACES_PRICE: 5,
     DECIMAL_PLACES_PERCENT: 2,
     
     // Gesture thresholds
     SWIPE_VELOCITY_THRESHOLD: 500,
     SWIPE_TRANSLATION_THRESHOLD: 100,
     SWIPE_DIRECTION_THRESHOLD: 50,
     
     // Price thresholds
     LOW_PRICE_THRESHOLD: 1,
     LOW_PRICE_MAX_DECIMALS: 6,
     
     // Formatting
     SIGNIFICANT_FIGURES: 5,
     MAX_DECIMALS_PERPS: 6,
     MAX_DECIMALS_SPOT: 8,
     
     // Time calculations
     MILLISECONDS_PER_SECOND: 1000,
     SECONDS_PER_MINUTE: 60,
     MINUTES_PER_HOUR: 60,
     HOURS_PER_DAY: 24,
     DAYS_PER_WEEK: 7,
     DAYS_PER_MONTH: 30,
     
     // UI dimensions
     MODAL_SLIDE_INITIAL: 1000,
     BALANCE_FONT_SIZE: 52,
     BALANCE_PADDING_TOP: 20,
     BALANCE_PADDING_BOTTOM: 30,
     
     // Percentage calculations
     PERCENTAGE_MULTIPLIER: 100,
     
     // Default values
     DEFAULT_LEVERAGE: 1,
     DEFAULT_SZ_DECIMALS: 4,
   } as const;
   ```

2. Replace all magic numbers in codebase with references to these constants
3. Group related constants logically

**Verification:**

- No magic numbers remain in business logic
- All numeric values are named constants

### Step 1.3: Create Animation Constants

**New file:** `src/theme/animations.ts`

**Actions:**

1. Extract animation-related constants:
   ```typescript
   export const ANIMATION_CONFIG = {
     durations: {
       short: 150,
       medium: 250,
       long: 500,
     },
     easing: {
       default: 'easeInOut',
     },
     values: {
       modalSlideInitial: 1000,
       slideDistance: 50,
     },
   } as const;
   ```

2. Replace hardcoded animation durations and values

**Verification:**

- All animation durations use constants
- Consistent animation timing across app

### Step 1.4: Enhance Spacing & Typography Tokens

**Files to modify:**

- `src/theme/spacing.ts`
- `src/theme/typography.ts`

**Actions:**

1. Add missing spacing values used in codebase:

   - `xxs: 2` (if needed)
   - Review all hardcoded padding/margin values and add tokens

2. Add missing typography values:

   - Review font sizes used (15, 20, 28, 52) and add to tokens
   - Add font weight constants

3. Replace hardcoded spacing/typography values in styles

**Verification:**

- No hardcoded spacing values in styles
- No hardcoded font sizes/weights

---

## Phase 2: Consolidate Utility Functions

### Step 2.1: Consolidate Formatting Functions

**Files to modify:**

- `src/lib/formatting.ts` (expand this)
- Remove duplicates from:
  - `src/screens/HomeScreen.tsx`
  - `src/screens/SearchScreen.tsx`
  - `src/screens/ChartScreen.tsx`
  - `src/screens/PortfolioScreen.tsx`
  - `src/screens/HistoryScreen.tsx`
  - `src/components/ClosePositionModal.tsx`

**Actions:**

1. Audit all formatting functions across files:

   - `formatPrice` (multiple versions)
   - `formatNumber` (multiple versions)
   - `formatPercent` / `formatPercentage` (multiple versions)
   - `formatLargeNumber` (multiple versions)
   - `formatDollarAmount` (HistoryScreen)
   - `formatWithCommas` (already in formatting.ts)

2. Create unified versions in `src/lib/formatting.ts`:
   ```typescript
   // Display formatting (for UI)
   export function formatPriceDisplay(price: number | string | null | undefined, maxDecimals?: number): string
   export function formatNumberDisplay(num: number | null | undefined, maxDecimals?: number): string
   export function formatPercentDisplay(num: number, decimals?: number): string
   export function formatLargeNumberDisplay(num: number | string | null | undefined): string
   export function formatDollarAmount(amount: string | number): string
   
   // Order formatting (for API - keep existing)
   export function formatPrice(price: number, szDecimals: number, isPerp?: boolean): string
   export function formatSize(size: number, szDecimals: number, price?: number): string
   ```

3. Update all imports across codebase
4. Remove duplicate function definitions
5. Ensure consistent behavior across all usages

**Verification:**

- Single source of truth for formatting
- All screens use shared formatting functions
- No duplicate formatting logic

### Step 2.2: Create Calculation Utilities

**New file:** `src/lib/calculations/position.ts`

**Actions:**

1. Extract PnL calculation logic:
   ```typescript
   export function calculatePositionPnL(
     position: PerpPosition,
     currentPrice: string | number
   ): { pnl: number; pnlPercent: number }
   ```

2. Extract price change calculations:
   ```typescript
   export function calculatePriceChange(
     currentPrice: number,
     previousPrice: number
   ): { change: number; changePercent: number }
   ```

3. Extract balance calculations:
   ```typescript
   export function calculateSpotTotalValue(balances: SpotBalance[], prices: Record<string, string>): number
   export function calculateStakingValue(stakingSummary: StakingSummary, hypePrice: number): number
   ```

4. Replace duplicate calculations in:

   - `HomeScreen.tsx`
   - `PortfolioScreen.tsx`
   - `ChartScreen.tsx`
   - `SearchScreen.tsx`

**Verification:**

- No duplicate calculation logic
- All calculations use shared utilities

### Step 2.3: Create Price Utilities

**New file:** `src/lib/calculations/price.ts`

**Actions:**

1. Extract price-related utilities:
   ```typescript
   export function getPriceChangeColor(changePercent: number): string
   export function getPriceChangeSign(changePercent: number): string
   export function calculateExecutionPrice(currentPrice: number, isBuy: boolean): number
   ```

2. Replace duplicate logic across files

**Verification:**

- Consistent price change handling

---

## Phase 3: Create Shared UI Primitives

### Step 3.1: Create Base Text Component

**New file:** `src/components/ui/Text.tsx`

**Actions:**

1. Create typed Text component:
   ```typescript
   interface TextProps {
     variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label'
     color?: keyof typeof Color
     weight?: 'regular' | 'medium' | 'semibold' | 'bold'
     // ... other props
   }
   ```

2. Map variants to typography tokens
3. Replace repetitive Text components gradually (start with most common patterns)

**Verification:**

- Text component works with existing styles
- Typography tokens properly applied

### Step 3.2: Create Button Component

**New file:** `src/components/ui/Button.tsx`

**Actions:**

1. Create Button component with variants:
   ```typescript
   interface ButtonProps {
     variant?: 'primary' | 'secondary' | 'buy' | 'sell' | 'text' | 'danger'
     size?: 'sm' | 'md' | 'lg'
     // ... other props
   }
   ```

2. Extract common button patterns:

   - Buy/Sell buttons (ChartScreen, OrderTicket)
   - Primary action buttons
   - Text buttons (Deposit button in HomeScreen)
   - Danger buttons (Close All)

3. Replace repetitive TouchableOpacity + Text patterns

**Verification:**

- Buttons match existing design
- All variants work correctly

### Step 3.3: Create Card Component

**New file:** `src/components/ui/Card.tsx`

**Actions:**

1. Create Card component for position cells:
   ```typescript
   interface CardProps {
     variant?: 'default' | 'position' | 'balance'
     onPress?: () => void
     // ... other props
   }
   ```

2. Extract position cell pattern from:

   - `HomeScreen.tsx` (positionCell style)
   - `PortfolioScreen.tsx`
   - `ChartScreen.tsx`

3. Replace repetitive View + TouchableOpacity patterns

**Verification:**

- Cards match existing position cell design
- Consistent spacing and styling

### Step 3.4: Create Modal Component

**New file:** `src/components/ui/Modal.tsx`

**Actions:**

1. Create base Modal component:
   ```typescript
   interface ModalProps {
     visible: boolean
     onClose: () => void
     title?: string
     variant?: 'bottomSheet' | 'center' | 'fullScreen'
     // ... other props
   }
   ```

2. Extract common modal patterns:

   - Overlay + content structure
   - Header with close button
   - Slide animations

3. Refactor modals to use base component:

   - `ClosePositionModal.tsx`
   - `TPSLEditModal.tsx`
   - `OrderTicket.tsx` (partial - keep custom layout)
   - Other modals

**Verification:**

- Modals maintain existing behavior
- Consistent modal UX

### Step 3.5: Enhance Skeleton Component

**File to modify:** `src/components/SkeletonScreen.tsx`

**Actions:**

1. Review current SkeletonScreen implementation
2. Make it more modular/reusable if needed
3. Ensure it uses design tokens

**Verification:**

- Skeleton uses tokens
- Reusable across screens

### Step 3.6: Create Filter Selector Component

**New file:** `src/components/ui/FilterSelector.tsx`

**Actions:**

1. Extract filter selector pattern:

   - Used in HomeScreen (Perp/Spot/Account)
   - Used in SearchScreen (Perp/Spot)
   - Used in HistoryScreen (Trades/Ledger)
   - Used in PortfolioScreen (time filter)

2. Create reusable component:
   ```typescript
   interface FilterSelectorProps<T extends string> {
     options: T[]
     selected: T
     onSelect: (option: T) => void
     // ... other props
   }
   ```

3. Replace duplicate filter implementations

**Verification:**

- Consistent filter behavior
- Sliding line animation works

---

## Phase 4: Refactor Screen Components

### Step 4.1: Refactor HomeScreen

**File:** `src/screens/HomeScreen.tsx`

**Actions:**

1. Replace formatting functions with imports from `lib/formatting`
2. Replace calculations with imports from `lib/calculations`
3. Replace magic numbers with constants from `theme/numbers`
4. Replace hardcoded colors with Color enum
5. Replace repetitive Text/Button patterns with UI primitives
6. Extract position cell rendering into reusable component or use Card
7. Update styles to use spacing/typography tokens exclusively

**Verification:**

- No functionality broken
- Code is cleaner and more maintainable

### Step 4.2: Refactor ChartScreen

**File:** `src/screens/ChartScreen.tsx`

**Actions:**

1. Same as Step 4.1
2. Extract Buy/Sell buttons to use Button component
3. Extract position display logic
4. Consolidate formatting functions

**Verification:**

- Chart functionality intact
- Code follows new patterns

### Step 4.3: Refactor PortfolioScreen

**File:** `src/screens/PortfolioScreen.tsx`

**Actions:**

1. Same as Step 4.1
2. Extract filter selector to use FilterSelector component
3. Extract action buttons to use Button component
4. Consolidate calculations

**Verification:**

- Portfolio calculations correct
- UI consistent with other screens

### Step 4.4: Refactor SearchScreen

**File:** `src/screens/SearchScreen.tsx`

**Actions:**

1. Replace formatting functions
2. Replace calculations
3. Replace filter selector
4. Extract market item rendering (consider Card component)

**Verification:**

- Search functionality intact
- Performance maintained

### Step 4.5: Refactor HistoryScreen

**File:** `src/screens/HistoryScreen.tsx`

**Actions:**

1. Replace formatting functions
2. Replace filter selector
3. Extract trade/ledger item rendering

**Verification:**

- History display correct
- Filtering works

### Step 4.6: Refactor Remaining Screens

**Files:**

- `ProfileScreen.tsx`
- `ConnectScreen.tsx`
- `EnableSessionKeyScreen.tsx`
- `SplashScreen.tsx`

**Actions:**

1. Apply same refactoring patterns
2. Use design tokens
3. Use UI primitives where applicable

---

## Phase 5: Refactor Component Styles

### Step 5.1: Standardize Style Files

**Files:** All files in `src/components/styles/` and `src/screens/styles/`

**Actions:**

1. Ensure all styles use:

   - Color enum (no hardcoded colors)
   - Spacing tokens (no magic numbers)
   - Typography tokens (no hardcoded font sizes)

2. Extract common style patterns into shared style utilities if needed
3. Review and consolidate similar styles across files

**Verification:**

- Consistent style patterns
- No hardcoded values

### Step 5.2: Create Shared Style Utilities

**New file:** `src/theme/styles.ts` (optional)

**Actions:**

1. If common patterns emerge, create shared style utilities:
   ```typescript
   export const commonStyles = {
     separator: { ... },
     container: { ... },
     // etc.
   }
   ```

2. Use sparingly - prefer component composition

---

## Phase 6: Type Organization

### Step 6.1: Review and Organize Types

**File:** `src/types/index.ts`

**Actions:**

1. Ensure all types are properly exported
2. Group related types
3. Add JSDoc comments for complex types
4. Check for duplicate type definitions

**Verification:**

- Types are well-organized
- No duplicate definitions

### Step 6.2: Extract Component-Specific Types

**Actions:**

1. Move component-specific types to component files where appropriate
2. Keep shared types in `types/index.ts`
3. Use consistent naming conventions

---

## Phase 7: Final Cleanup & Documentation

### Step 7.1: Remove Unused Code

**Actions:**

1. Search for unused imports
2. Remove commented-out code
3. Remove unused utility functions
4. Clean up unused style definitions

**Verification:**

- No dead code
- Clean codebase

### Step 7.2: Add JSDoc Comments

**Actions:**

1. Add JSDoc comments to:

   - All exported functions
   - Complex components
   - Utility functions

2. Document parameters and return types

**Verification:**

- Key functions documented
- Better IDE support

### Step 7.3: Create Component Index Files

**Actions:**

1. Create `src/components/ui/index.ts` for easy imports
2. Create `src/lib/formatting/index.ts` if needed
3. Create `src/lib/calculations/index.ts` for easy imports

**Verification:**

- Clean import paths
- Easy to use shared code

---

## Testing Strategy

### After Each Phase:

1. **Manual Testing:**

   - Test all screens render correctly
   - Test all user interactions
   - Test modals open/close
   - Test form submissions
   - Test navigation

2. **Visual Testing:**

   - Compare before/after screenshots
   - Ensure styling matches original design

3. **Functional Testing:**

   - Test order placement
   - Test position closing
   - Test deposits/withdrawals
   - Test all modals

### Regression Testing:

- Test critical user flows end-to-end
- Verify calculations are correct
- Verify formatting is consistent

---

## Migration Order Summary

1. **Phase 1**: Design tokens (colors, spacing, typography, numbers, animations)
2. **Phase 2**: Utility functions (formatting, calculations)
3. **Phase 3**: UI primitives (Text, Button, Card, Modal, FilterSelector)
4. **Phase 4**: Screen refactoring (one screen at a time)
5. **Phase 5**: Style standardization
6. **Phase 6**: Type organization
7. **Phase 7**: Cleanup & documentation

---

## Success Criteria

- ✅ No magic numbers in business logic
- ✅ All colors use Color enum
- ✅ All spacing uses spacing tokens
- ✅ All typography uses typography tokens
- ✅ Single source of truth for formatting functions
- ✅ Single source of truth for calculations
- ✅ Shared UI primitives used consistently
- ✅ No duplicate code patterns
- ✅ All functionality preserved
- ✅ Code is maintainable and scalable

---

## Notes

- **Incremental Approach**: Each phase builds on the previous one
- **Backward Compatibility**: Ensure each step doesn't break existing functionality
- **Testing**: Test thoroughly after each major change
- **Git Commits**: Commit after each completed step for easy rollback
- **Code Review**: Review changes before moving to next phase
# UI Folder Structure

This document outlines the folder structure and conventions used in the `src/ui/` directory for organizing screens, modals, and shared components.

## Philosophy

- **Modularity**: Each screen/modal is self-contained with its own components and styles
- **Separation of Concerns**: Components, styles, and logic are clearly separated
- **Reusability**: Shared components are extracted to common locations
- **Discoverability**: Clear naming and structure make it easy to find code
- **Consistency**: All screens and modals follow the same organizational pattern

---

## Overall Structure

```
src/ui/
├── screens/           # Screen-level components (full pages in navigation)
│   ├── {screen_name}/ # Individual screen folders
│   ├── styles/        # Shared styles across multiple screens
│   └── index.ts       # Screen exports
├── modals/            # Modal components (overlays)
│   ├── {modal_name}/  # Individual modal folders
│   ├── shared/        # Shared modal components and styles
│   └── index.ts       # Modal exports
├── shared/            # Shared UI components and styles
│   ├── components/    # Reusable components used across screens/modals
│   └── styles/        # Global styles (colors, typography, spacing)
├── navigation/        # Navigation configuration
└── chart/             # Chart-specific UI components
```

---

## Screens Structure

Each screen follows this pattern:

```
screens/
└── {screen_name}/
    ├── {ScreenName}.tsx           # Main screen component (ONLY file imported externally)
    ├── components/                # Screen-specific components
    │   ├── {ComponentName}.tsx    # Individual component files
    │   └── index.ts               # Component exports
    ├── styles/                    # Screen-specific styles
    │   ├── {ScreenName}.styles.ts # Main screen styles
    │   ├── {ComponentName}.styles.ts # Component-specific styles
    │   └── shared.styles.ts       # Shared styles within this screen (optional)
    └── index.ts                   # Screen export
```

### Screen Example: `home_screen/`

```
home_screen/
├── HomeScreen.tsx                     # Main screen (imported by navigation)
├── components/
│   ├── BalanceContent.tsx            # Screen-specific components
│   ├── PerpPositionsContainer.tsx
│   ├── SpotBalancesContainer.tsx
│   ├── StakingContainer.tsx
│   ├── StarredTickersContainer.tsx
│   └── index.ts
├── styles/
│   ├── HomeScreen.styles.ts          # Main screen styles
│   ├── BalanceContent.styles.ts      # Component styles
│   ├── PerpPositionsContainer.styles.ts
│   ├── shared.styles.ts              # Styles shared within home_screen
│   └── ...
└── index.ts
```

### Screen Conventions

1. **Main Component**: `{ScreenName}.tsx` - The only file that should be imported from outside the folder
2. **Components Folder**: Contains all screen-specific subcomponents
3. **Styles Folder**: One style file per component + optional `shared.styles.ts`
4. **Index File**: Exports only the main screen component
5. **Naming**: Use PascalCase for files, snake_case for folder names

---

## Modals Structure

Modals follow a similar pattern to screens, with an additional `shared/` folder for reusable modal components.

```
modals/
├── shared/                           # Shared across all modals
│   ├── components/                   # Reusable modal components
│   │   ├── {component_name}/         # Individual component folder
│   │   │   ├── {ComponentName}.tsx   # Component file
│   │   │   └── styles/
│   │   │       └── {ComponentName}.styles.ts
│   │   └── index.ts                  # Exports all shared components
│   └── styles/
│       └── shared.styles.ts          # Shared modal styles
└── {modal_name}/                     # Individual modal
    ├── {ModalName}.tsx               # Main modal component (ONLY file imported externally)
    ├── components/                   # Modal-specific components
    │   ├── {component_name}/         # Component folder
    │   │   ├── {ComponentName}.tsx   # Component file
    │   │   └── styles/
    │   │       └── {ComponentName}.styles.ts
    │   └── index.ts
    ├── styles/
    │   └── {ModalName}.styles.ts
    └── index.ts
```

### Modal Example: `deposit_modal/`

```
modals/
├── shared/
│   ├── components/
│   │   ├── modal_header/
│   │   │   ├── ModalHeader.tsx
│   │   │   └── styles/
│   │   │       └── ModalHeader.styles.ts
│   │   ├── info_container/
│   │   │   ├── InfoContainer.tsx           # Exports InfoContainer & InfoRow
│   │   │   └── styles/
│   │   │       └── InfoContainer.styles.ts
│   │   ├── input_container/
│   │   │   ├── InputContainer.tsx
│   │   │   └── styles/
│   │   │       └── InputContainer.styles.ts
│   │   ├── warning_container/
│   │   │   ├── WarningContainer.tsx
│   │   │   └── styles/
│   │   │       └── WarningContainer.styles.ts
│   │   └── index.ts
│   └── styles/
│       └── shared.styles.ts
└── deposit_modal/
    ├── DepositModal.tsx                    # Main modal component
    ├── components/
    │   ├── deposit_button/
    │   │   ├── DepositButton.tsx
    │   │   └── styles/
    │   │       └── DepositButton.styles.ts
    │   ├── footer_text/
    │   │   ├── FooterText.tsx
    │   │   └── styles/
    │   │       └── FooterText.styles.ts
    │   └── index.ts
    ├── styles/
    │   └── DepositModal.styles.ts
    └── index.ts
```

### Modal Conventions

1. **Shared Components**: Components used by multiple modals go in `modals/shared/components/`
2. **Component Folders**: Each component gets its own folder with a `styles/` subfolder
3. **Modal-Specific**: Components unique to one modal stay in that modal's `components/` folder
4. **Index Files**: Export components for easy importing
5. **Naming**: Use snake_case for folder names, PascalCase for file names

---

## Shared Components Structure

Components used across multiple screens AND modals live in `ui/shared/`.

```
shared/
├── components/
│   ├── {component_name}/
│   │   ├── {ComponentName}.tsx
│   │   └── styles/
│   │       └── {ComponentName}.styles.ts
│   └── index.ts
└── styles/
    ├── colors.ts          # Global color definitions
    ├── typography.ts      # Typography styles
    ├── spacing.ts         # Spacing constants
    └── index.ts           # Style exports
```

### Shared Component Examples

```
shared/
├── components/
│   ├── panel_selector/
│   │   ├── PanelSelector.tsx
│   │   └── styles/
│   │       └── PanelSelector.styles.ts
│   ├── empty_state/
│   │   ├── EmptyState.tsx
│   │   └── styles/
│   │       └── EmptyState.styles.ts
│   ├── loading_blob/
│   │   └── LoadingBlob.tsx            # Simple component, no styles file
│   └── index.ts
└── styles/
    ├── colors.ts
    ├── typography.ts
    ├── spacing.ts
    └── index.ts
```

### Shared Component Conventions

1. **Truly Shared**: Only extract components that are genuinely reused
2. **No Screen/Modal Logic**: Should be generic and configurable via props
3. **Self-Contained**: Each component folder is independent
4. **Global Styles**: `styles/` folder contains design tokens (colors, typography, etc.)

---

## Import Path Patterns

### From Screen Components

```typescript
// Import from the same screen's components
import { BalanceContent } from './components';

// Import from the same screen's styles
import { styles } from './styles/HomeScreen.styles';

// Import shared UI components
import { PanelSelector, EmptyState } from '../../shared/components';

// Import global styles
import { Color } from '../../shared/styles/colors';

// Import contexts (outside ui/)
import { useWallet } from '../../../contexts/WalletContext';
```

### From Modal Components

```typescript
// Import from shared modal components
import { ModalHeader, InfoContainer, InputContainer } from '../shared/components';

// Import from modal-specific components
import { DepositButton, FooterText } from './components';

// Import from modal styles
import { styles } from './styles/DepositModal.styles';

// Import shared UI components
import { LoadingBlob } from '../../shared/components';

// Import global styles
import { Color } from '../../shared/styles/colors';
```

### From Shared Component Styles

```typescript
// From modals/shared/components/{component}/styles/
import { Color } from '../../../../../shared/styles/colors';

// From screens/{screen}/components/ (direct files, not in subfolders)
import { Color } from '../../../shared/styles/colors';
```

### Import Path Rules

1. **Relative Paths**: Always use relative imports within `src/ui/`
2. **Count Carefully**: Each `../` goes up one directory level
3. **Verify Paths**: Test imports to ensure they resolve correctly
4. **Consistent Style**: Always import `Color` from `styles/colors`, not from `styles/index`

---

## Naming Conventions

### Files
- **Components**: `PascalCase.tsx` (e.g., `BalanceContent.tsx`, `ModalHeader.tsx`)
- **Styles**: `PascalCase.styles.ts` (e.g., `BalanceContent.styles.ts`)
- **Exports**: `index.ts` (lowercase)

### Folders
- **Screens**: `snake_case` (e.g., `home_screen/`, `chart_screen/`)
- **Modals**: `snake_case` (e.g., `deposit_modal/`, `withdraw_modal/`)
- **Components**: `snake_case` (e.g., `modal_header/`, `input_container/`)
- **Special**: `shared/`, `components/`, `styles/` (lowercase)

### Components
- **Screen Components**: `{ScreenName}Screen.tsx` (e.g., `HomeScreen.tsx`)
- **Modal Components**: `{ModalName}Modal.tsx` (e.g., `DepositModal.tsx`)
- **Subcomponents**: Descriptive names (e.g., `BalanceContent.tsx`, `DepositButton.tsx`)

---

## Decision Tree: Where Does This Component Go?

### Is it used by multiple screens AND modals?
→ **YES**: `ui/shared/components/{component_name}/`

### Is it only used by modals?

#### Is it used by multiple modals?
→ **YES**: `ui/modals/shared/components/{component_name}/`

#### Is it specific to one modal?
→ **YES**: `ui/modals/{modal_name}/components/{component_name}/`

### Is it only used by screens?

#### Is it used by multiple screens?
→ **YES**: `ui/shared/components/{component_name}/`

#### Is it specific to one screen?
→ **YES**: `ui/screens/{screen_name}/components/{ComponentName}.tsx`

---

## Component Migration Rules

When refactoring:

1. **Start with the main component** (Screen or Modal)
2. **Identify all subcomponents** that can be modularized
3. **Check if subcomponent exists elsewhere**
   - If yes → Move to appropriate shared folder
   - If no → Create in local components folder
4. **Create style files** for each component
5. **Keep helper functions** in main component initially
6. **Update imports** throughout the codebase
7. **Test functionality** to ensure nothing broke
8. **Do NOT delete original files** without explicit permission

---

## Example: Complete File Structure

```
src/ui/
├── screens/
│   ├── home_screen/
│   │   ├── HomeScreen.tsx
│   │   ├── components/
│   │   │   ├── BalanceContent.tsx
│   │   │   ├── PerpPositionsContainer.tsx
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   ├── HomeScreen.styles.ts
│   │   │   ├── BalanceContent.styles.ts
│   │   │   └── shared.styles.ts
│   │   └── index.ts
│   └── styles/
│       └── shared.styles.ts
├── modals/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── modal_header/
│   │   │   │   ├── ModalHeader.tsx
│   │   │   │   └── styles/
│   │   │   │       └── ModalHeader.styles.ts
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── shared.styles.ts
│   ├── deposit_modal/
│   │   ├── DepositModal.tsx
│   │   ├── components/
│   │   │   ├── deposit_button/
│   │   │   │   ├── DepositButton.tsx
│   │   │   │   └── styles/
│   │   │   │       └── DepositButton.styles.ts
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── DepositModal.styles.ts
│   │   └── index.ts
│   └── index.ts
├── shared/
│   ├── components/
│   │   ├── panel_selector/
│   │   │   ├── PanelSelector.tsx
│   │   │   └── styles/
│   │   │       └── PanelSelector.styles.ts
│   │   ├── loading_blob/
│   │   │   └── LoadingBlob.tsx
│   │   └── index.ts
│   └── styles/
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── index.ts
├── navigation/
│   ├── TabNavigator.tsx
│   └── RootNavigator.tsx
└── chart/
    └── LightweightChartBridge.tsx
```

---

## Best Practices

1. **One Component, One Responsibility**: Each component should do one thing well
2. **Colocate Styles**: Keep styles next to the components that use them
3. **Minimize Nesting**: Avoid deep component hierarchies
4. **Export Properly**: Use `index.ts` files for clean imports
5. **Name Descriptively**: Component names should clearly indicate their purpose
6. **Document Changes**: Update this file when patterns change
7. **Consistency Over Cleverness**: Follow established patterns even if there's a "better" way

---

## Refactoring Checklist

When adding a new screen or modal:

- [ ] Create folder with `snake_case` naming
- [ ] Create main component file (`{Name}Screen.tsx` or `{Name}Modal.tsx`)
- [ ] Create `components/` folder for subcomponents
- [ ] Create `styles/` folder for style files
- [ ] Create `index.ts` export file
- [ ] Add component-specific subfolders with `styles/` subfolders
- [ ] Update parent `index.ts` to export new component
- [ ] Verify all import paths are correct
- [ ] Test that the component renders correctly
- [ ] Check for linter errors

---

**Last Updated**: November 8, 2025
**Status**: Active - This is the current standard for UI organization


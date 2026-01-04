import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook that tracks whether the app is in the foreground (active) or background.
 * Useful for pausing/resuming expensive operations like polling when the app is not visible.
 *
 * @returns boolean - true if the app is in the foreground (active), false if backgrounded
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAppActive = useAppVisibility();
 *
 *   useEffect(() => {
 *     if (!isAppActive) {
 *       // Pause expensive operations
 *       return;
 *     }
 *     // Resume operations
 *   }, [isAppActive]);
 * }
 * ```
 */
export function useAppVisibility(): boolean {
  const [isActive, setIsActive] = useState<boolean>(
    AppState.currentState === 'active'
  );

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsActive(nextAppState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return isActive;
}

/**
 * Hook that provides callbacks for when the app transitions between foreground and background.
 * More granular than useAppVisibility - allows running code on transitions.
 *
 * @param onForeground - Callback when app becomes active
 * @param onBackground - Callback when app goes to background
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useAppStateTransition(
 *     () => console.log('App foregrounded'),
 *     () => console.log('App backgrounded')
 *   );
 * }
 * ```
 */
export function useAppStateTransition(
  onForeground?: () => void,
  onBackground?: () => void
): void {
  const previousStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = previousStateRef.current;
      previousStateRef.current = nextAppState;

      // Transitioning from background/inactive to active
      if (
        previousState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onForeground?.();
      }

      // Transitioning from active to background/inactive
      if (
        previousState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        onBackground?.();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground]);
}

/**
 * Hook that returns a stable callback that only executes when the app is in the foreground.
 * Useful for wrapping callbacks that shouldn't run when the app is backgrounded.
 *
 * @param callback - The callback to wrap
 * @returns A wrapped callback that only executes when app is active
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const safeRefresh = useActiveCallback(() => {
 *     fetchData();
 *   });
 *
 *   useEffect(() => {
 *     const interval = setInterval(safeRefresh, 5000);
 *     return () => clearInterval(interval);
 *   }, [safeRefresh]);
 * }
 * ```
 */
export function useActiveCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const isActiveRef = useRef<boolean>(AppState.currentState === 'active');

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      isActiveRef.current = nextAppState === 'active';
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const wrappedCallback = useCallback(
    (...args: Parameters<T>): ReturnType<T> | undefined => {
      if (isActiveRef.current) {
        return callback(...args);
      }
      return undefined;
    },
    [callback]
  ) as T;

  return wrappedCallback;
}

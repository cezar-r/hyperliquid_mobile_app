# Fix Maximum Update Depth on Chart Screen

## Diagnosis (what’s happening)

- The Chart screen’s subscription effect resubscribes on changes to callback identities and tick-size derived inputs. This can cascade: unsubscribe → provider setState → new render → effect runs again, eventually hitting React’s update-depth guard.
- Evidence: The error follows WalletContext polling and PerpOrderTicket logging; ChartScreen is active, and the effect below runs on many inputs.
```323:388:src/ui/screens/chart_screen/ChartScreen.tsx
useEffect(() => {
  if (!selectedCoin || !intervalLoaded || !interval) return;

  fetchHistoricalCandles(selectedCoin, interval);

  const handleLiveCandle = (candle: Candle): void => {
    setCandles((prev) => { /* ... */ });
  };

  subscribeToCandles(selectedCoin, interval, handleLiveCandle);
  subscribeToOrderbook(selectedCoin, { mantissa, nSigFigs });
  subscribeToTrades(selectedCoin);

  return () => {
    unsubscribeFromCandles();
    unsubscribeFromOrderbook();
    unsubscribeFromTrades();
  };
}, [
  selectedCoin,
  interval,
  intervalLoaded,
  subscribeToCandles,
  unsubscribeFromCandles,
  subscribeToOrderbook,
  unsubscribeFromOrderbook,
  subscribeToTrades,
  unsubscribeFromTrades,
  fetchHistoricalCandles,
  mantissa,
  nSigFigs,
]);
```

- The subscription functions are recreated when provider state changes if their dependencies are too broad. Also, `mantissa`/`nSigFigs` fluctuate with price, forcing unnecessary resubscribes. In provider, unsubs call setState, contributing to feedback.
```430:479:src/contexts/WebSocketContext.tsx
const subscribeToOrderbook = useCallback(
  async (coin: string, opts?: { nSigFigs?: number; mantissa?: number }) => {
    const client = subscriptionClientRef.current;
    if (!client) return;

    if (orderbookSubIdRef.current) {
      await orderbookSubIdRef.current.unsubscribe().catch(/* setState logging */);
      orderbookSubIdRef.current = null;
    }
    const subscriptionCoin = resolveSubscriptionCoin(
      state.marketType,
      coin,
      state.spotMarkets
    );
    /* logs */
    const params: any = { coin: subscriptionCoin };
    /* opts currently not used */
    const sub = await client.l2Book(params, (data: any) => {
      setState((prev) => ({ ...prev, orderbook }));
    });
    orderbookSubIdRef.current = sub;
  }, [state.marketType, state.spotMarkets]
);
```


## Changes

- Tighten ChartScreen subscription effect dependencies to only values that truly require resubscribe (coin, interval, intervalLoaded). Remove function refs and tick-size derived values from the deps, and don’t pass `mantissa/nSigFigs` (they’re unused in subscribe).
- Ensure context value identities are stable to avoid needless effect re-runs.
- Only mount `PerpOrderTicket` when visible to avoid extra renders/effects while hidden.
- Add an error boundary to capture component stack if this recurs.

## Implementation steps

1. Update `src/ui/screens/chart_screen/ChartScreen.tsx`:

   - Change the subscribe effect deps to `[selectedCoin, interval, intervalLoaded]`.
   - Stop passing `{ mantissa, nSigFigs }` to `subscribeToOrderbook` or gate resubscribe on explicit tick-size changes only.

2. Update `src/contexts/WebSocketContext.tsx`:

   - Wrap `value` in `useMemo` so consumers don’t see new object identities each render.
   - Audit `useCallback` deps to ensure they don’t depend on frequently-changing state (keep to `state.marketType` and `state.spotMarkets` where needed).

3. Update `src/ui/screens/chart_screen/ChartScreen.tsx`:

   - Render `PerpOrderTicket` only when `showOrderTicket` is true (conditional mount, not just `visible` prop).

4. Add `src/ui/shared/components/ErrorBoundary.tsx` and wrap app root (or ChartScreen subtree) to log the component stack for any “Maximum update depth” error.
5. Manual verify on iOS:

   - Open Chart screen, idle ~2–3 minutes. Confirm no resubscribe spam in logs and no redbox.

## Notes

- If you want tick-based orderbook precision later, implement a debounced resubscribe triggered only when price crosses a tick threshold, not every price update.
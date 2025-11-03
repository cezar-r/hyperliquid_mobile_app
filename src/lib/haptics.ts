import * as Haptics from 'expo-haptics';

/**
 * Plays a haptic feedback when a toggle panel selection is changed.
 * Uses the Rigid impact style for a crisp, immediate feel.
 */
export function playToggleHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
}

export function playNavbarHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Plays a haptic feedback when navigating to the chart screen from a cell.
 * Uses the Light impact style for a subtle navigation feel.
 */
export function playNavToChartHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Plays a haptic feedback when order ticket selections change.
 * Used for buy/sell, limit/market, and cross/isolated toggles.
 * Uses the Medium impact style for a balanced tactile response.
 */
export function playOrderTicketSelectionChangeHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Plays a haptic feedback during slider interactions.
 * Uses the Soft impact style for gentle, continuous feedback.
 */
export function playSliderChangeHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

/**
 * Plays a haptic feedback when submitting an order.
 * Uses the Rigid impact style for a crisp, definitive feel.
 */
export function playOrderSubmitHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
}

/**
 * Plays a haptic feedback for market actions like closing positions.
 * Uses the Medium impact style for important but not critical actions.
 */
export function playMarketActionHaptic(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
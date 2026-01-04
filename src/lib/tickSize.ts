/**
 * Tick size calculation utilities for orderbook display.
 * Generates valid tick size options based on current price and asset constraints.
 */

export interface TickSizeOption {
  value: number;
  label: string;
  index: number; // Index in the options array for nSigFigs calculation
}

/**
 * Shifts a number down one power of 10.
 */
function mapToLowerPower(x: number): number {
    if (x === 0) return 0;
  
    // Step 1: take x down one power (divide by 10)
    const down = x / 10;
  
    // Step 2: work with absolute value to find magnitude
    const a = Math.abs(down);
  
    // If downscaled magnitude is < 1e-308 or so, avoid log10 domain errors
    if (a === 0) return 0;
  
    // Step 3: largest power of 10 <= a is 10^floor(log10(a))
    const pow = Math.floor(Math.log10(a));
    const value = Math.pow(10, pow);
  
    // Restore original sign
    return Math.sign(x) * value;
  }

/**
 * Counts significant figures in a number, excluding leading zeros.
 */
function countSigFigs(num: number): number {
  if (num === 0) return 1;
  
  const str = num.toString();
  
  // Handle scientific notation
  if (str.includes('e')) {
    const [mantissa] = str.split('e');
    return mantissa.replace('.', '').replace('-', '').length;
  }
  
  // Remove decimal point and count non-zero digits plus any zeros between them
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    if (parseInt(intPart) !== 0) {
      // Integer part is non-zero
      return (intPart + decPart).length;
    } else {
      // Integer part is zero, count from first non-zero digit
      const firstNonZero = decPart.search(/[1-9]/);
      if (firstNonZero === -1) return 1;
      return decPart.substring(firstNonZero).length;
    }
  } else {
    // No decimal point - remove trailing zeros for sig figs
    return str.replace(/0+$/, '').length;
  }
}

/**
 * Counts decimal places in a number.
 */
function countDecimals(num: number): number {
  const str = num.toString();
  if (str.includes('e')) {
    // Handle scientific notation
    const [, exponent] = str.split('e');
    const exp = parseInt(exponent);
    if (exp >= 0) return 0;
    return Math.abs(exp);
  }
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) return 0;
  return str.length - decimalIndex - 1;
}

/**
 * Checks if a tick size is valid for the given price and constraints.
 * 
 * Rules:
 * - Prices can have up to 5 significant figures
 * - No more than MAX_DECIMALS - szDecimals decimal places
 * - Integer prices are always allowed, regardless of sig figs
 */
function isValidTickSize(
  price: number,
  tickSize: number,
  szDecimals: number,
  maxDecimals: number // 6 for perps, 8 for spot
): boolean {
  const maxAllowedDecimals = maxDecimals - szDecimals;
  
  let workingPrice: number;
  if (price > 1) {
    // If price > 1, make it whole
    workingPrice = Math.floor(price);
  } else {
    // If price < 1, cut off decimals so it has at most maxAllowedDecimals
    const multiplier = Math.pow(10, maxAllowedDecimals);
    workingPrice = Math.floor(price * multiplier) / multiplier;
  }
  
  // If tick size is >= 1 and working price is an integer, it's always valid
  if (tickSize >= 1 && Number.isInteger(workingPrice)) {
    return true;
  }
  
  // Calculate what a price would look like rounded to this tick
  // For example: price=111000, tick=0.1 -> could be 111000.1
  let testPrice = tickSize < 1 ? workingPrice + tickSize : workingPrice;
  
  // Fix JavaScript floating point precision errors by rounding to reasonable precision
  // Count decimals in tick size and round to that + a few extra places
  const tickDecimals = countDecimals(tickSize);
  const roundToDecimals = Math.min(tickDecimals + 2, 15); // Cap at 15 to be safe
  testPrice = Number(testPrice.toFixed(roundToDecimals));
  
  // Check if resulting price is an integer - integers are always allowed
  if (Number.isInteger(testPrice)) {
    return true;
  }
  
  // Check decimal places constraint
  const decimals = countDecimals(testPrice);
  if (decimals > maxAllowedDecimals) {
    return false;
  }
 
  // Check significant figures constraint (only applies to non-integers)
  const sigFigs = countSigFigs(testPrice);
  if (sigFigs > 5 && price > 1) {
    return false;
  }
  
  return true;
}

/**
 * Generates tick size options based on current price and asset constraints.
 * 
 * @param currentPrice - Current market price
 * @param szDecimals - Size decimals for the asset (order size precision)
 * @param isSpot - Whether the asset is spot (true) or perp (false)
 * 
 * Examples:
 * - BTC (price=111000, szDecimals=0, perp): [1, 10, 100, 1000, 10000]
 * - ETH (price=4000, szDecimals=1, perp): [0.1, 1, 10, 100]
 * - X (price=0.00384, szDecimals=?, ?): [0.000001, 0.00001, 0.0001]
 */
export function generateTickSizeOptions(
  currentPrice: number,
  szDecimals: number,
  isSpot: boolean = false
): TickSizeOption[] {
  const maxDecimals = isSpot ? 8 : 6;
  
  // Calculate max tick size
  const maxTick = Math.min(10000, mapToLowerPower(currentPrice));
  
  const options: TickSizeOption[] = [];
  
  // Start from max tick and go down by powers of 10
  let currentTick = maxTick;
  
  while (currentTick >= 0.00001) { // Set a reasonable lower bound
    if (isValidTickSize(currentPrice, currentTick, szDecimals, maxDecimals)) {
      options.push({
        value: currentTick,
        label: formatTickSize(currentTick),
        index: 0, // Will be set after reversing
      });
    } else {
      // Once we hit an invalid tick, all smaller ticks will also be invalid
      break;
    }
    
    // Move to next power of 10 down
    currentTick = currentTick / 10;
  }
  
  // Reverse to show smallest to largest and set indices
  const reversedOptions = options.reverse();
  reversedOptions.forEach((opt, idx) => {
    opt.index = idx;
  });
  
  return reversedOptions;
}

/**
 * Formats a tick size value for display.
 */
function formatTickSize(value: number): string {
  if (value >= 1) {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toString();
  } else {
    // For values < 1, determine decimal places needed
    const str = value.toString();
    if (str.includes('e')) {
      // Handle scientific notation - convert to fixed
      const decimals = Math.abs(parseInt(str.split('e')[1]));
      return value.toFixed(decimals + 1);
    }
    const decimalPart = str.split('.')[1] || '';
    return value.toFixed(decimalPart.length);
  }
}

/**
 * Calculates the mantissa value for a given tick size.
 * Note: Based on Hyperliquid SDK, mantissa can only be 2 or 5 when nSigFigs is 5.
 * For now, returning undefined to let the API auto-determine aggregation.
 * 
 * @param tickSize - The selected tick size
 * @returns undefined (let API determine)
 */
export function calculateMantissa(tickSize: number): number | undefined {
  // TODO: Determine correct mapping from tick size to mantissa
  // SDK shows mantissa can only be 2 or 5 (when nSigFigs is 5)
  // For now, let the API auto-determine the aggregation
  return undefined;
}

/**
 * Calculates the number of significant figures for a given tick size.
 * Based on Hyperliquid SDK, nSigFigs can be 2, 3, 4, or 5.
 *
 * The formula accounts for price magnitude:
 * nSigFigs = floor(log10(price)) + 1 - floor(log10(tickSize))
 *
 * @param tickSize - The selected tick size
 * @param options - The array of tick size options to find the index
 * @param currentPrice - The current market price (needed for calculation)
 * @returns The nSigFigs value or undefined
 */
export function calculateNSigFigs(
  tickSize: number,
  options: TickSizeOption[],
  currentPrice: number
): number | undefined {
  const option = options.find(opt => opt.value === tickSize);
  if (!option) {
    return undefined;
  }

  // Index 0 (minimum tick) uses auto/default
  if (option.index === 0) {
    return undefined;
  }

  // Guard against invalid price
  if (currentPrice <= 0) {
    return undefined;
  }

  // Calculate nSigFigs based on price and tick size
  // priceDigits = number of digits in the integer part of price
  const priceDigits = Math.floor(Math.log10(currentPrice)) + 1;
  const tickDigits = Math.floor(Math.log10(tickSize));
  const nSigFigs = priceDigits - tickDigits;

  // Clamp to valid range (2-5)
  return Math.max(2, Math.min(5, nSigFigs));
}

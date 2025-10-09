/**
 * Typography constants and font family definitions.
 */

export const fontFamilies = {
  regular: 'Teodor',
  medium: 'TeodorMed',
  thin: 'TeodorThin',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export type FontFamily = typeof fontFamilies;
export type FontSize = typeof fontSizes;


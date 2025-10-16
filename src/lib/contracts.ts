/**
 * Contract addresses and ABIs for deposits
 */

// Bridge2 contract addresses
export const BRIDGE2 = {
  mainnet: '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7',
  testnet: '0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89',
} as const;

// USDC contract addresses
export const USDC = {
  mainnet: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum mainnet USDC
  testnet: '0x1baAbB04529D43a73232B713C0FE471f7c7334d5', // Arbitrum testnet USDC2
  decimals: 6,
} as const;

// Minimal ERC-20 ABI for USDC operations
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;


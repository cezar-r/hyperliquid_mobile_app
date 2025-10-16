/**
 * Deposit utilities for USDC bridge from Arbitrum to Hyperliquid
 */

import type { WalletClient, PublicClient } from 'viem';
import { toHex } from 'viem';
import { ARBITRUM_ONE, ARBITRUM_SEPOLIA, type ChainInfo } from './chains';
import { BRIDGE2, USDC, ERC20_ABI } from './contracts';

/**
 * Get the Arbitrum chain configuration for the current environment
 */
export function getArbitrumChainForEnv(isMainnet: boolean): ChainInfo {
  return isMainnet ? ARBITRUM_ONE : ARBITRUM_SEPOLIA;
}

/**
 * Get the Bridge2 contract address for the current environment
 */
export function getBridgeAddress(isMainnet: boolean): string {
  return isMainnet ? BRIDGE2.mainnet : BRIDGE2.testnet;
}

/**
 * Get the USDC contract address for the current environment
 */
export function getUsdcAddress(isMainnet: boolean): string {
  return isMainnet ? USDC.mainnet : USDC.testnet;
}

/**
 * Ensure the wallet is connected to the correct Arbitrum chain.
 * Attempts to switch chains, and if that fails, adds the chain first.
 */
export async function ensureArbitrumChain(
  walletClient: WalletClient,
  chain: ChainInfo
): Promise<void> {
  const provider = walletClient.transport;

  try {
    // Try to switch to the chain
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHex(chain.id) }],
    });
  } catch (switchError: any) {
    // If the chain is not added, add it first
    if (switchError.code === 4902 || switchError.code === -32603) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: toHex(chain.id),
              chainName: chain.name,
              rpcUrls: chain.rpcUrls,
              nativeCurrency: chain.nativeCurrency,
              blockExplorerUrls: chain.blockExplorers,
            },
          ],
        });
      } catch (addError) {
        throw new Error(`Failed to add ${chain.name} to wallet: ${addError}`);
      }
    } else {
      throw new Error(`Failed to switch to ${chain.name}: ${switchError.message}`);
    }
  }
}

/**
 * Read USDC balance for an address
 */
export async function readUsdcBalance(
  publicClient: PublicClient,
  usdcAddress: string,
  owner: string
): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner as `0x${string}`],
  });

  return balance as bigint;
}

/**
 * Transfer USDC to an address (used for depositing to Bridge2)
 */
export async function transferUsdc(
  walletClient: WalletClient,
  usdcAddress: string,
  to: string,
  amountBaseUnits: bigint,
  chain: ChainInfo
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to as `0x${string}`, amountBaseUnits],
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: {
        default: { http: chain.rpcUrls },
        public: { http: chain.rpcUrls },
      },
      blockExplorers: {
        default: { name: 'Arbiscan', url: chain.blockExplorers[0] },
      },
    } as any,
  });

  return hash;
}


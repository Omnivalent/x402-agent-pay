/**
 * Balance checking utilities for x402 payments
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { NETWORKS, USDC_ADDRESSES } from './config';

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface BalanceResult {
  wallet: string;
  network: string;
  balanceRaw: bigint;
  balanceUsdc: string;
  sufficient: boolean;
  requiredAmount?: string;
}

/**
 * Get USDC address for a network
 */
export function getUsdcAddress(network: string): `0x${string}` {
  const address = USDC_ADDRESSES[network];
  if (!address) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return address;
}

/**
 * Check USDC balance for a wallet on a specific network
 */
export async function checkBalance(
  wallet: string,
  network: string = 'base',
  requiredAmount?: string
): Promise<BalanceResult> {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const client = createPublicClient({
    chain: networkConfig.chain,
    transport: http(networkConfig.rpc),
  });

  const usdcAddress = USDC_ADDRESSES[network];
  
  const balanceRaw = await client.readContract({
    address: usdcAddress,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: [wallet as `0x${string}`],
  });

  const balanceUsdc = formatUnits(balanceRaw, 6); // USDC has 6 decimals
  
  let sufficient = true;
  if (requiredAmount) {
    const required = BigInt(Math.floor(parseFloat(requiredAmount) * 1e6));
    sufficient = balanceRaw >= required;
  }

  return {
    wallet,
    network,
    balanceRaw,
    balanceUsdc,
    sufficient,
    requiredAmount,
  };
}

/**
 * Check if wallet has sufficient balance for a payment
 */
export async function hasSufficientBalance(
  wallet: string,
  amount: string,
  network: string = 'base'
): Promise<boolean> {
  const result = await checkBalance(wallet, network, amount);
  return result.sufficient;
}

/**
 * Get balances across all supported networks
 */
export async function checkAllBalances(
  wallet: string
): Promise<Record<string, BalanceResult>> {
  const results: Record<string, BalanceResult> = {};
  
  const networks = Object.keys(NETWORKS);
  
  await Promise.all(
    networks.map(async (network) => {
      try {
        results[network] = await checkBalance(wallet, network);
      } catch (error) {
        results[network] = {
          wallet,
          network,
          balanceRaw: 0n,
          balanceUsdc: '0',
          sufficient: false,
        };
      }
    })
  );

  return results;
}

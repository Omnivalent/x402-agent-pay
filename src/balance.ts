/**
 * Balance checking utilities for x402 payments
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { CHAINS, USDC_ADDRESSES, NetworkName } from './config';

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
  network: NetworkName;
  balanceRaw: bigint;
  balanceUsdc: string;
  sufficient: boolean;
  requiredAmount?: string;
}

/**
 * Get USDC address for a network
 */
export function getUsdcAddress(network: NetworkName): `0x${string}` {
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
  network: NetworkName = 'base',
  requiredAmount?: string
): Promise<BalanceResult> {
  const chain = CHAINS[network];
  if (!chain) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(),
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
  network: NetworkName = 'base'
): Promise<boolean> {
  const result = await checkBalance(wallet, network, amount);
  return result.sufficient;
}

/**
 * Get balances across all supported networks
 */
export async function checkAllBalances(
  wallet: string
): Promise<Record<NetworkName, BalanceResult>> {
  const networks: NetworkName[] = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon'];
  const results: Record<string, BalanceResult> = {};

  await Promise.all(
    networks.map(async (network) => {
      try {
        results[network] = await checkBalance(wallet, network);
      } catch (e) {
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

  return results as Record<NetworkName, BalanceResult>;
}

/**
 * x402-agent-pay Configuration
 * Network configs, spending policies, and constants
 */

import { base, mainnet, arbitrum, optimism, polygon } from 'viem/chains';
import type { Chain } from 'viem';

// Network identifiers (CAIP-2 format for x402 v2)
export const NETWORK_IDS = {
  base: 'eip155:8453',
  ethereum: 'eip155:1',
  arbitrum: 'eip155:42161',
  optimism: 'eip155:10',
  polygon: 'eip155:137',
  baseSepolia: 'eip155:84532',
} as const;

export type NetworkName = keyof typeof NETWORK_IDS;

// Chain configs
export const CHAINS: Record<NetworkName, Chain> = {
  base,
  ethereum: mainnet,
  arbitrum,
  optimism,
  polygon,
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://sepolia.base.org'] },
    },
    testnet: true,
  },
};

// USDC addresses per network
export const USDC_ADDRESSES: Record<NetworkName, `0x${string}`> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
};

// Facilitator URL
export const FACILITATOR_URL = 'https://x402.org/facilitator';

/**
 * Payment Policy — spending controls for autonomous agents
 * 
 * Comprehensive limits to prevent wallet drain from:
 * - Single large transactions
 * - Cumulative spending over time
 * - Rapid-fire loops (velocity limits)
 * - Payments to unknown/malicious addresses
 */
export interface PaymentPolicy {
  /** Maximum USDC per single transaction (in human units, e.g., 0.50) */
  maxPerTransaction: number;
  /** Maximum USDC per 24 hours (in human units, e.g., 10.00) */
  dailyLimit: number;
  /** Maximum USDC per week (optional) */
  weeklyLimit?: number;
  /** Maximum USDC per month (optional) */
  monthlyLimit?: number;
  /** Maximum transactions per hour - prevents rapid-fire loops */
  maxTransactionsPerHour?: number;
  /** Maximum USDC per recipient per day - limits exposure to single address */
  perRecipientDailyLimit?: number;
  /** Whitelist of approved recipient addresses (if set, only these can receive) */
  approvedRecipients?: string[];
  /** Blacklist of blocked recipient addresses */
  blockedRecipients?: string[];
  /** Require dry-run simulation before actual payment */
  requireDryRun?: boolean;
  /** Auto-approve payments under this amount without logging (in human units) */
  autoApproveUnder?: number;
  /** Simulate payment through facilitator before signing (extra safety) */
  simulateBeforePay?: boolean;
}

/** Default conservative policy for agents */
export const DEFAULT_POLICY: PaymentPolicy = {
  maxPerTransaction: 1.00,  // Max $1 per transaction
  dailyLimit: 10.00,        // Max $10 per day
  maxTransactionsPerHour: 60, // Max 60 tx/hour (prevents loops)
  autoApproveUnder: 0.10,   // Auto-approve under $0.10
  requireDryRun: false,
};

/**
 * Payment Receipt for audit trail
 */
export interface PaymentReceipt {
  id: string;
  timestamp: string;
  url: string;
  amount: string;
  amountRaw: string;
  currency: string;
  network: NetworkName;
  recipient: string;
  txHash?: string;
  status: 'success' | 'failed' | 'pending' | 'blocked';
  blockReason?: string;
  facilitatorResponse?: unknown;
}

/**
 * Agent client configuration
 */
export interface AgentPayConfig {
  /** Wallet private key (with 0x prefix) */
  privateKey: string;
  /** Primary network (default: base) */
  network?: NetworkName;
  /** Spending policy */
  policy?: PaymentPolicy;
  /** Path to store receipts (default: ./receipts.json) */
  receiptsPath?: string;
  /** Callback when payment is made */
  onPayment?: (receipt: PaymentReceipt) => void;
  /** Callback when payment is blocked by policy */
  onBlocked?: (reason: string, details: unknown) => void;
}

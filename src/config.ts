/**
 * Network configuration and constants for x402 payments
 */

import { base, mainnet, arbitrum, optimism, polygon, type Chain } from 'viem/chains';

export interface NetworkConfig {
  chain: Chain;
  rpc: string;
}

export interface PaymentRequirement {
  amount: string;
  currency: string;
  network: string;
  recipient: string;
  scheme: string;
  facilitator?: string;
}

export interface PaymentSignature {
  signature: string;
  sender: string;
  nonce: number;
  network: string;
  scheme: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  base: { 
    chain: base, 
    rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org' 
  },
  ethereum: { 
    chain: mainnet, 
    rpc: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com' 
  },
  arbitrum: { 
    chain: arbitrum, 
    rpc: process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc' 
  },
  optimism: { 
    chain: optimism, 
    rpc: process.env.OP_RPC_URL || 'https://mainnet.optimism.io' 
  },
  polygon: { 
    chain: polygon, 
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com' 
  },
};

export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
};

export const EIP712_DOMAIN = {
  name: 'x402',
  version: '2',
};

export const EIP712_TYPES = {
  Payment: [
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'token', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
};

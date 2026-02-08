/**
 * x402-agent-pay
 * Seamless USDC payments for AI agents using the x402 protocol
 */

export { x402Fetch, x402Client, wrapFetch } from './client';
export { checkBalance, getUsdcAddress } from './balance';
export { 
  NETWORKS, 
  USDC_ADDRESSES, 
  type PaymentRequirement,
  type NetworkConfig 
} from './config';

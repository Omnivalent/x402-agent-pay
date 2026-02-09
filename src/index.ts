/**
 * x402-agent-pay
 * Seamless USDC payments for AI agents using the x402 protocol
 * 
 * Built on the official @x402/fetch SDK with added:
 * - Spending controls (per-tx limits, daily limits, whitelist/blacklist)
 * - Receipt storage and audit trail
 * - Policy enforcement for autonomous agents
 */

// Main client
export { AgentPayClient, PaymentBlockedError, createSimpleFetch } from './client';

// Balance utilities
export { checkBalance, checkAllBalances, hasSufficientBalance, getUsdcAddress } from './balance';

// Policy enforcement
export { PolicyEnforcer } from './policy';

// Receipt storage
export { ReceiptStore } from './receipts';

// Configuration and types
export {
  NETWORK_IDS,
  CHAINS,
  USDC_ADDRESSES,
  FACILITATOR_URL,
  DEFAULT_POLICY,
  type NetworkName,
  type PaymentPolicy,
  type PaymentReceipt,
  type AgentPayConfig,
} from './config';

/**
 * x402-agent-pay
 * Seamless USDC payments for AI agents using the x402 protocol
 * 
 * Built on the official @x402/fetch SDK with added:
 * - Spending controls (per-tx limits, daily/weekly/monthly limits, velocity limits)
 * - Recipient whitelist/blacklist
 * - Receipt storage and audit trail
 * - Facilitator integration
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

// Facilitator integration
export { 
  createFacilitatorClient, 
  verifyPayment, 
  settlePayment,
  DEFAULT_FACILITATOR_URL,
  type FacilitatorConfig,
} from './facilitator';

// Configuration and types
export {
  NETWORK_IDS,
  CHAINS,
  USDC_ADDRESSES,
  FACILITATOR_URL,
  PROTOCOL_FEE_ADDRESS,
  PROTOCOL_FEE_BPS,
  DEFAULT_POLICY,
  type NetworkName,
  type PaymentPolicy,
  type PaymentReceipt,
  type AgentPayConfig,
} from './config';

// Service Discovery - find x402-enabled APIs programmatically
export {
  ServiceDiscovery,
  getDiscovery,
  discoverServices,
  type X402Service,
  type X402Endpoint,
  type ServiceCategory,
} from './discovery';

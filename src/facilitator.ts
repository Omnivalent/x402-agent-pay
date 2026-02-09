/**
 * Facilitator Integration for x402 Protocol
 * Connects to Coinbase's x402 facilitator for payment verification and settlement
 */

import { HTTPFacilitatorClient } from '@x402/core/http';

// Default Coinbase facilitator URL
export const DEFAULT_FACILITATOR_URL = 'https://x402.org/facilitator';

export interface FacilitatorConfig {
  url?: string;
  timeout?: number;
}

/**
 * Create a facilitator client for payment verification/settlement
 */
export function createFacilitatorClient(config: FacilitatorConfig = {}): HTTPFacilitatorClient {
  return new HTTPFacilitatorClient({
    url: config.url || DEFAULT_FACILITATOR_URL,
  });
}

/**
 * Verify a payment through the facilitator
 */
export async function verifyPayment(
  facilitator: HTTPFacilitatorClient,
  paymentPayload: unknown,
  requirements: unknown
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const result = await facilitator.verify(paymentPayload as any, requirements as any);
    return { isValid: result.isValid, error: result.isValid ? undefined : 'Verification failed' };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Settle a payment through the facilitator
 */
export async function settlePayment(
  facilitator: HTTPFacilitatorClient,
  paymentPayload: unknown,
  requirements: unknown
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const result = await facilitator.settle(paymentPayload as any, requirements as any);
    return { 
      success: result.success, 
      txHash: result.transaction as string | undefined,
      error: result.success ? undefined : 'Settlement failed'
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

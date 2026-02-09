/**
 * x402 Agent Pay Client
 * Wraps official @x402/fetch with spending controls and receipt tracking
 */

import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';
import { formatUnits } from 'viem';
import {
  AgentPayConfig,
  PaymentReceipt,
  NetworkName,
  NETWORK_IDS,
  DEFAULT_POLICY,
} from './config';
import { PolicyEnforcer } from './policy';
import { ReceiptStore } from './receipts';

export interface PaymentDetails {
  amount: string;
  amountRaw: string;
  recipient: string;
  network: NetworkName;
}

/**
 * Agent Pay Client with policy enforcement
 */
export class AgentPayClient {
  private fetchWithPayment: typeof fetch;
  private policy: PolicyEnforcer;
  private receipts: ReceiptStore;
  private config: AgentPayConfig;
  private account: ReturnType<typeof privateKeyToAccount>;

  constructor(config: AgentPayConfig) {
    this.config = config;
    this.account = privateKeyToAccount(config.privateKey as `0x${string}`);
    this.policy = new PolicyEnforcer(config.policy || DEFAULT_POLICY);
    this.receipts = new ReceiptStore(config.receiptsPath || './receipts.json');

    // Create x402-enabled fetch using official SDK
    this.fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [
        {
          network: 'eip155:*', // Support all EVM chains
          client: new ExactEvmScheme(this.account),
        },
      ],
    });
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.account.address;
  }

  /**
   * Make a payment-enabled request with policy enforcement
   */
  async fetch(
    url: string,
    init?: RequestInit,
    options?: { skipPolicyCheck?: boolean; network?: NetworkName }
  ): Promise<Response> {
    const network = options?.network || this.config.network || 'base';

    // First, make a HEAD/GET to check if payment is required
    const probeResponse = await fetch(url, {
      method: 'HEAD',
      ...init,
    }).catch(() => null);

    // If we get a 402, extract payment details for policy check
    if (probeResponse?.status === 402) {
      const paymentHeader = probeResponse.headers.get('X-Payment') || 
                            probeResponse.headers.get('Payment-Required');
      
      if (paymentHeader && !options?.skipPolicyCheck) {
        try {
          const decoded = JSON.parse(atob(paymentHeader));
          const amountRaw = decoded.maxAmountRequired || decoded.amount || '0';
          const amountUsdc = parseFloat(formatUnits(BigInt(amountRaw), 6));
          const recipient = decoded.payTo || decoded.recipient || 'unknown';

          // Check policy
          const policyResult = this.policy.checkPayment(amountUsdc, recipient);
          
          if (!policyResult.allowed) {
            // Record blocked payment
            const receipt = this.receipts.recordBlocked(
              url,
              amountUsdc.toFixed(6),
              amountRaw,
              recipient,
              network,
              policyResult.reason!
            );

            this.config.onBlocked?.(policyResult.reason!, { url, amount: amountUsdc, recipient });

            throw new PaymentBlockedError(policyResult.reason!, receipt);
          }
        } catch (e) {
          if (e instanceof PaymentBlockedError) throw e;
          // If we can't parse payment details, proceed anyway (policy check skipped)
          console.warn('[x402] Could not parse payment header for policy check:', e);
        }
      }
    }

    // Make the actual payment-enabled request
    const response = await this.fetchWithPayment(url, init);

    // If payment was made, record receipt
    const paymentResponse = response.headers.get('X-Payment-Response') ||
                            response.headers.get('Payment-Response');
    
    if (paymentResponse) {
      try {
        const decoded = decodePaymentResponseHeader(paymentResponse);
        const amountRaw = String(decoded.amount || '0');
        const amountUsdc = parseFloat(formatUnits(BigInt(amountRaw), 6));

        // Record successful payment
        this.policy.recordPayment(amountUsdc);
        
        const receipt = this.receipts.createReceipt({
          url,
          amount: amountUsdc.toFixed(6),
          amountRaw,
          currency: 'USDC',
          network,
          recipient: String(decoded.recipient || 'unknown'),
          txHash: decoded.transactionHash as string | undefined,
          facilitatorResponse: decoded,
        });
        
        this.receipts.updateReceipt(receipt.id, { status: 'success' });
        this.config.onPayment?.(receipt);
      } catch (e) {
        console.warn('[x402] Could not parse payment response:', e);
      }
    }

    return response;
  }

  /**
   * Get spending status
   */
  getSpendingStatus() {
    return this.policy.getStatus();
  }

  /**
   * Get payment history
   */
  getHistory(limit?: number) {
    return limit ? this.receipts.getRecent(limit) : this.receipts.getAll();
  }

  /**
   * Get today's receipts
   */
  getTodayReceipts() {
    return this.receipts.getToday();
  }

  /**
   * Export receipts as CSV
   */
  exportReceiptsCsv(): string {
    return this.receipts.exportCsv();
  }
}

/**
 * Error thrown when payment is blocked by policy
 */
export class PaymentBlockedError extends Error {
  public receipt: PaymentReceipt;

  constructor(reason: string, receipt: PaymentReceipt) {
    super(`Payment blocked: ${reason}`);
    this.name = 'PaymentBlockedError';
    this.receipt = receipt;
  }
}

/**
 * Create a simple wrapped fetch (no policy, direct SDK usage)
 */
export function createSimpleFetch(privateKey: string): typeof fetch {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: 'eip155:*',
        client: new ExactEvmScheme(account),
      },
    ],
  });
}

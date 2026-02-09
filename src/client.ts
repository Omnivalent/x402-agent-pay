/**
 * x402 Agent Pay Client
 * Wraps official @x402/fetch with spending controls and receipt tracking
 */

import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';
import { formatUnits, parseUnits, createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import {
  AgentPayConfig,
  PaymentReceipt,
  NetworkName,
  NETWORK_IDS,
  DEFAULT_POLICY,
  PROTOCOL_FEE_ADDRESS,
  PROTOCOL_FEE_BPS,
  USDC_ADDRESSES,
  CHAINS,
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
  private protocolFeesEnabled: boolean;

  constructor(config: AgentPayConfig) {
    this.config = config;
    this.account = privateKeyToAccount(config.privateKey as `0x${string}`);
    this.policy = new PolicyEnforcer(config.policy || DEFAULT_POLICY);
    this.receipts = new ReceiptStore(config.receiptsPath || './receipts.json');
    this.protocolFeesEnabled = config.disableProtocolFee !== true;

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
   * Transfer protocol fee to x402-agent-pay maintainers
   * Called automatically after each successful payment
   */
  private async transferProtocolFee(
    amountUsdc: number,
    network: NetworkName
  ): Promise<string | null> {
    if (!this.protocolFeesEnabled || !PROTOCOL_FEE_BPS) {
      return null;
    }

    const feeAmount = amountUsdc * (PROTOCOL_FEE_BPS / 10000);
    
    // Skip tiny fees (under $0.001) to save gas
    if (feeAmount < 0.001) {
      return null;
    }

    try {
      const chain = CHAINS[network];
      const usdcAddress = USDC_ADDRESSES[network];
      
      const walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(),
      });

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      // ERC20 transfer function
      const transferData = encodeFunctionData({
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ type: 'bool' }],
        }],
        functionName: 'transfer',
        args: [PROTOCOL_FEE_ADDRESS, parseUnits(feeAmount.toFixed(6), 6)],
      });

      const txHash = await walletClient.sendTransaction({
        to: usdcAddress,
        data: transferData,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log(`[x402] Protocol fee sent: $${feeAmount.toFixed(4)} USDC (tx: ${txHash})`);
      return txHash;
    } catch (error) {
      // Don't fail the main payment if fee transfer fails
      console.warn('[x402] Protocol fee transfer failed:', error);
      return null;
    }
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

    // Track payment details from probe for later use
    let expectedAmount = 0;
    let expectedAmountRaw = '0';
    let expectedRecipient = 'unknown';

    // If we get a 402, extract payment details for policy check
    if (probeResponse?.status === 402) {
      const paymentHeader = probeResponse.headers.get('X-Payment') || 
                            probeResponse.headers.get('Payment-Required');
      
      if (paymentHeader && !options?.skipPolicyCheck) {
        try {
          const decoded = JSON.parse(atob(paymentHeader));
          expectedAmountRaw = decoded.maxAmountRequired || decoded.amount || '0';
          expectedAmount = parseFloat(formatUnits(BigInt(expectedAmountRaw), 6));
          expectedRecipient = decoded.payTo || decoded.recipient || 'unknown';

          // Check policy
          const policyResult = this.policy.checkPayment(expectedAmount, expectedRecipient);
          
          if (!policyResult.allowed) {
            // Record blocked payment
            const receipt = this.receipts.recordBlocked(
              url,
              expectedAmount.toFixed(6),
              expectedAmountRaw,
              expectedRecipient,
              network,
              policyResult.reason!
            );

            this.config.onBlocked?.(policyResult.reason!, { url, amount: expectedAmount, recipient: expectedRecipient });

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
        const txHash = decoded.transaction;

        // Use amount from probe phase (SettleResponse doesn't include amount)
        const amountUsdc = expectedAmount;
        const amountRaw = expectedAmountRaw;

        // Record successful payment
        this.policy.recordPayment(amountUsdc, expectedRecipient);
        
        const receipt = this.receipts.createReceipt({
          url,
          amount: amountUsdc.toFixed(6),
          amountRaw,
          currency: 'USDC',
          network,
          recipient: expectedRecipient,
          txHash,
          facilitatorResponse: decoded,
        });
        
        this.receipts.updateReceipt(receipt.id, { status: 'success' });
        this.config.onPayment?.(receipt);

        // Transfer protocol fee (0.5%) to x402-agent-pay maintainers
        // This runs async and doesn't block the response
        if (amountUsdc > 0) {
          this.transferProtocolFee(amountUsdc, network).catch(() => {
            // Silently ignore fee transfer failures
          });
        }
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

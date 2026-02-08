/**
 * x402 Client - Payment-enabled HTTP client for AI agents
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { 
  NETWORKS, 
  USDC_ADDRESSES, 
  EIP712_DOMAIN, 
  EIP712_TYPES,
  type PaymentRequirement,
  type PaymentSignature 
} from './config';

export interface X402ClientOptions {
  privateKey: string;
  network?: string;
  onPayment?: (payment: PaymentReceipt) => void;
}

export interface X402FetchOptions {
  url: string;
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  network?: string;
  dryRun?: boolean;
}

export interface PaymentReceipt {
  timestamp: string;
  url: string;
  amount: string;
  currency: string;
  network: string;
  recipient: string;
  txHash?: string;
}

/**
 * Decode base64 PAYMENT-REQUIRED header
 */
function decodePaymentRequired(header: string): PaymentRequirement[] {
  try {
    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
    return Array.isArray(decoded) ? decoded : [decoded];
  } catch {
    throw new Error('Failed to decode PAYMENT-REQUIRED header');
  }
}

/**
 * Create EIP-712 signed payment
 */
async function createPaymentSignature(
  requirement: PaymentRequirement,
  privateKey: string
): Promise<string> {
  const networkConfig = NETWORKS[requirement.network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${requirement.network}`);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: networkConfig.chain,
    transport: http(networkConfig.rpc),
  });

  const usdcAddress = USDC_ADDRESSES[requirement.network];
  const nonce = Date.now();

  const domain = {
    ...EIP712_DOMAIN,
    chainId: networkConfig.chain.id,
  };

  const message = {
    recipient: requirement.recipient as `0x${string}`,
    amount: BigInt(requirement.amount),
    token: usdcAddress,
    nonce: BigInt(nonce),
  };

  const signature = await client.signTypedData({
    domain,
    types: EIP712_TYPES,
    primaryType: 'Payment',
    message,
  });

  const payload: PaymentSignature = {
    signature,
    sender: account.address,
    nonce,
    network: requirement.network,
    scheme: requirement.scheme,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Make an x402 payment-enabled fetch request
 */
export async function x402Fetch(options: X402FetchOptions & { privateKey: string }): Promise<Response> {
  const { url, method = 'GET', body, headers = {}, network = 'base', dryRun = false, privateKey } = options;

  // Step 1: Initial request
  const initialResponse = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  });

  // If not 402, return directly
  if (initialResponse.status !== 402) {
    return initialResponse;
  }

  // Step 2: Parse payment requirements
  const paymentHeader = initialResponse.headers.get('PAYMENT-REQUIRED');
  if (!paymentHeader) {
    throw new Error('402 response missing PAYMENT-REQUIRED header');
  }

  const requirements = decodePaymentRequired(paymentHeader);
  
  if (dryRun) {
    console.log('[x402] Dry run - payment requirements:', requirements);
    return initialResponse;
  }

  // Step 3: Select requirement matching preferred network
  const requirement = requirements.find(r => r.network === network) || requirements[0];

  // Step 4: Create payment signature
  const paymentSignature = await createPaymentSignature(requirement, privateKey);

  // Step 5: Retry with payment
  const paidResponse = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'PAYMENT-SIGNATURE': paymentSignature,
    },
    body,
  });

  return paidResponse;
}

/**
 * Create a reusable x402 client
 */
export function x402Client(options: X402ClientOptions) {
  const { privateKey, network = 'base', onPayment } = options;

  return {
    fetch: async (url: string, init?: RequestInit) => {
      return x402Fetch({
        url,
        method: init?.method,
        body: init?.body as string | undefined,
        headers: init?.headers as Record<string, string> | undefined,
        network,
        privateKey,
      });
    },
    
    getNetwork: () => network,
    
    setNetwork: (newNetwork: string) => {
      if (!NETWORKS[newNetwork]) {
        throw new Error(`Unsupported network: ${newNetwork}`);
      }
      return x402Client({ ...options, network: newNetwork });
    },
  };
}

/**
 * Wrap standard fetch with x402 payment handling
 */
export function wrapFetch(
  fetchFn: typeof fetch,
  options: { privateKey: string; network?: string }
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    return x402Fetch({
      url,
      method: init?.method,
      body: init?.body as string | undefined,
      headers: init?.headers as Record<string, string> | undefined,
      network: options.network || 'base',
      privateKey: options.privateKey,
    });
  };
}

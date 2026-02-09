#!/usr/bin/env npx ts-node
/**
 * CLI for x402-agent-pay
 * Make payment-enabled HTTP requests with policy enforcement
 */

import { AgentPayClient } from '../src/client';
import { checkBalance } from '../src/balance';
import { NetworkName, DEFAULT_POLICY } from '../src/config';

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
x402-agent-pay CLI

Usage:
  x402-fetch.ts <url> [options]          Make a payment-enabled request
  x402-fetch.ts balance <wallet>         Check USDC balance
  x402-fetch.ts status                   Show spending status
  x402-fetch.ts history [limit]          Show payment history

Options:
  --method <METHOD>     HTTP method (default: GET)
  --body <JSON>         Request body
  --network <NETWORK>   Network: base, ethereum, arbitrum, optimism, polygon, baseSepolia
  --dry-run             Show payment details without paying
  --skip-policy         Skip policy checks (dangerous!)
  --max-per-tx <USD>    Override max per transaction (default: ${DEFAULT_POLICY.maxPerTransaction})
  --daily-limit <USD>   Override daily limit (default: ${DEFAULT_POLICY.dailyLimit})

Environment:
  WALLET_PRIVATE_KEY    Required: Your wallet private key (0x...)

Examples:
  # Make a paid request
  x402-fetch.ts https://api.example.com/paid-endpoint

  # Check balance on Base
  x402-fetch.ts balance 0xYourWallet --network base

  # Custom limits
  x402-fetch.ts https://api.example.com/data --max-per-tx 5 --daily-limit 50
`);
}

async function main() {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey && args[0] !== 'balance') {
    console.error('Error: WALLET_PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  const command = args[0];

  // Balance command
  if (command === 'balance') {
    const wallet = args[1];
    if (!wallet) {
      console.error('Error: wallet address required');
      process.exit(1);
    }
    const networkIdx = args.indexOf('--network');
    const network = (networkIdx > -1 ? args[networkIdx + 1] : 'base') as NetworkName;
    
    const result = await checkBalance(wallet, network);
    console.log(`\n💰 Balance for ${wallet} on ${network}:`);
    console.log(`   ${result.balanceUsdc} USDC`);
    return;
  }

  // Status command
  if (command === 'status') {
    const client = new AgentPayClient({ privateKey: privateKey! });
    const status = client.getSpendingStatus();
    console.log('\n📊 Spending Status:');
    console.log(`   Today: $${status.daily.spent.toFixed(2)} spent (${status.daily.transactions} transactions)`);
    console.log(`   Remaining: $${status.daily.remaining.toFixed(2)} of $${status.policy.dailyLimit.toFixed(2)} daily limit`);
    console.log(`   Max per tx: $${status.policy.maxPerTransaction.toFixed(2)}`);
    return;
  }

  // History command
  if (command === 'history') {
    const limit = parseInt(args[1]) || 10;
    const client = new AgentPayClient({ privateKey: privateKey! });
    const history = client.getHistory(limit);
    
    console.log(`\n📜 Last ${limit} payments:`);
    if (history.length === 0) {
      console.log('   No payments recorded yet.');
    } else {
      for (const r of history) {
        const status = r.status === 'success' ? '✅' : r.status === 'blocked' ? '🚫' : '⏳';
        console.log(`   ${status} ${r.timestamp} | ${r.amount} USDC | ${r.url.substring(0, 50)}...`);
        if (r.txHash) console.log(`      tx: ${r.txHash}`);
        if (r.blockReason) console.log(`      reason: ${r.blockReason}`);
      }
    }
    return;
  }

  // Default: fetch URL
  const url = command;
  
  // Parse options
  const methodIdx = args.indexOf('--method');
  const method = methodIdx > -1 ? args[methodIdx + 1] : 'GET';
  
  const bodyIdx = args.indexOf('--body');
  const body = bodyIdx > -1 ? args[bodyIdx + 1] : undefined;
  
  const networkIdx = args.indexOf('--network');
  const network = (networkIdx > -1 ? args[networkIdx + 1] : 'base') as NetworkName;
  
  const dryRun = args.includes('--dry-run');
  const skipPolicy = args.includes('--skip-policy');

  const maxPerTxIdx = args.indexOf('--max-per-tx');
  const maxPerTransaction = maxPerTxIdx > -1 ? parseFloat(args[maxPerTxIdx + 1]) : DEFAULT_POLICY.maxPerTransaction;

  const dailyLimitIdx = args.indexOf('--daily-limit');
  const dailyLimit = dailyLimitIdx > -1 ? parseFloat(args[dailyLimitIdx + 1]) : DEFAULT_POLICY.dailyLimit;

  console.log(`[x402] Requesting: ${method} ${url}`);
  console.log(`[x402] Network: ${network}`);
  console.log(`[x402] Policy: max $${maxPerTransaction}/tx, $${dailyLimit}/day`);

  const client = new AgentPayClient({
    privateKey: privateKey!,
    network,
    policy: {
      maxPerTransaction,
      dailyLimit,
    },
    onPayment: (receipt) => {
      console.log(`\n✅ Payment successful!`);
      console.log(`   Amount: ${receipt.amount} USDC`);
      console.log(`   Recipient: ${receipt.recipient}`);
      if (receipt.txHash) console.log(`   TX: ${receipt.txHash}`);
    },
    onBlocked: (reason) => {
      console.log(`\n🚫 Payment blocked: ${reason}`);
    },
  });

  try {
    const response = await client.fetch(url, {
      method,
      body,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    }, {
      network,
      skipPolicyCheck: skipPolicy,
    });

    console.log(`[x402] Response: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('\n--- Response ---');
    console.log(text.substring(0, 2000));
    if (text.length > 2000) console.log('... (truncated)');
    
  } catch (error: any) {
    if (error.name === 'PaymentBlockedError') {
      console.error(`\n🚫 Payment blocked by policy: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main().catch(console.error);

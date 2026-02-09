#!/usr/bin/env npx ts-node
/**
 * Test Real x402 Payment on Base Sepolia
 * Requires USDC in wallet: 0x4Cd0c601a3b7E6EdA932765fbB8563138C1cdd24
 */

import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';

// Polymarket wallet (needs Base Sepolia USDC)
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || '0x1cbb243651579e1b5c74f7f90c25edbd78b1e00a04f83a7dc99cb7df7a393baf';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3402/weather';

async function main() {
  console.log('\n🔐 x402 Real Payment Test\n');
  
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log(`Wallet: ${account.address}`);
  
  // Create x402-enabled fetch
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: 'eip155:*',
        client: new ExactEvmScheme(account),
      },
    ],
  });

  console.log(`Target: ${TARGET_URL}`);
  console.log('Making paid request...\n');

  try {
    const response = await fetchWithPayment(TARGET_URL, {
      method: 'GET',
    });

    console.log(`Status: ${response.status}`);
    
    // Check for payment response header
    const paymentResponse = response.headers.get('payment-response') || 
                            response.headers.get('PAYMENT-RESPONSE');
    
    if (paymentResponse) {
      try {
        const decoded = decodePaymentResponseHeader(paymentResponse);
        console.log('\n✅ Payment successful!');
        console.log(`   TX Hash: ${decoded.transaction}`);
        console.log(`   Network: ${decoded.network}`);
        console.log(`   Success: ${decoded.success}`);
        
        // This is the key output for README
        console.log('\n📋 For README:');
        console.log(`   https://sepolia.basescan.org/tx/${decoded.transaction}`);
      } catch (e) {
        console.log('Raw payment response:', paymentResponse);
      }
    }

    const data = await response.json();
    console.log('\n📦 Response data:', JSON.stringify(data, null, 2));

  } catch (error: any) {
    if (error.message?.includes('insufficient')) {
      console.error('\n❌ Insufficient USDC balance');
      console.error('   Get testnet USDC from: https://faucet.circle.com');
      console.error('   Network: Base Sepolia');
      console.error(`   Address: ${account.address}`);
    } else {
      console.error('\n❌ Error:', error.message || error);
    }
    process.exit(1);
  }
}

main();

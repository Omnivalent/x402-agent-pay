#!/usr/bin/env npx ts-node
/**
 * Real x402 Server for Demo
 * Uses official @x402/express with facilitator.x402.org for on-chain payment verification
 */

import express from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const PORT = process.env.PORT || 3402;
const PAY_TO = process.env.PAY_TO || '0x209693Bc6aFC5C8A1C698b873e6C96E0a6ADa83c'; // Demo recipient

const app = express();
app.use(express.json());

// Set up the facilitator client (uses official x402 infrastructure)
const facilitatorClient = new HTTPFacilitatorClient({ 
  url: 'https://x402.org/facilitator' 
});

// Create resource server and register Base Sepolia payment scheme
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme());

// Define protected routes
const routes = {
  'GET /weather': {
    accepts: {
      scheme: 'exact',
      price: '$0.001', // 0.001 USDC = 1000 units (6 decimals)
      network: 'eip155:84532', // Base Sepolia
      payTo: PAY_TO,
      maxTimeoutSeconds: 300,
    },
    description: 'Weather data for Berlin',
  },
  'GET /api/data': {
    accepts: {
      scheme: 'exact',
      price: '$0.01', // 0.01 USDC
      network: 'eip155:84532',
      payTo: PAY_TO,
      maxTimeoutSeconds: 300,
    },
    description: 'Premium data endpoint',
  },
};

// Apply payment middleware
app.use(paymentMiddleware(routes, resourceServer));

// Health check (free)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    network: 'Base Sepolia (eip155:84532)',
    payTo: PAY_TO,
    timestamp: new Date().toISOString(),
  });
});

// Protected weather endpoint
app.get('/weather', (req, res) => {
  console.log('✅ Payment verified, returning weather data');
  res.json({
    location: 'Berlin',
    temperature: 7,
    conditions: 'Partly cloudy',
    humidity: 65,
    wind: '12 km/h NW',
    timestamp: new Date().toISOString(),
    message: 'This data was paid for with USDC on Base Sepolia!',
  });
});

// Protected data endpoint
app.get('/api/data', (req, res) => {
  console.log('✅ Payment verified, returning premium data');
  res.json({
    premium: true,
    data: {
      metrics: [1, 2, 3, 4, 5],
      timestamp: new Date().toISOString(),
    },
    message: 'Premium data unlocked via x402 payment',
  });
});

app.listen(PORT, () => {
  console.log(`
🔐 Real x402 Server running on http://localhost:${PORT}

Endpoints:
  GET /health   - Free health check
  GET /weather  - 0.001 USDC (Base Sepolia)
  GET /api/data - 0.01 USDC (Base Sepolia)

Payment recipient: ${PAY_TO}
Facilitator: https://x402.org/facilitator

To test with AgentPayClient:
  WALLET_PRIVATE_KEY=0x... npx ts-node scripts/x402-fetch.ts http://localhost:${PORT}/weather --network baseSepolia

Press Ctrl+C to stop
  `);
});

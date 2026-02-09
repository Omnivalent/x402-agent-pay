/**
 * Mock 402 Server for Demo
 * Simulates a paid API endpoint using x402 protocol
 */

import { createServer } from 'http';

const PORT = 3402;

// Simulated payment state
let paymentReceived = false;

const server = createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Check for payment header
  const paymentSignature = req.headers['payment-signature'];
  
  if (req.url === '/weather' || req.url === '/api/weather') {
    if (paymentSignature) {
      // Payment received - return data
      console.log('[PAID] Payment signature received, returning data');
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'X-Payment-Response': Buffer.from(JSON.stringify({
          success: true,
          amount: '10000', // 0.01 USDC
          recipient: '0x209693Bc6aFC5C8A1C698b873e6C96E0a6ADa83c',
          transactionHash: '0x' + 'a'.repeat(64),
        })).toString('base64'),
      });
      res.end(JSON.stringify({
        location: 'Berlin',
        temperature: 7,
        conditions: 'Partly cloudy',
        humidity: 65,
        wind: '12 km/h NW',
        timestamp: new Date().toISOString(),
      }, null, 2));
    } else {
      // No payment - return 402
      console.log('[402] No payment, returning payment required');
      const paymentRequirements = {
        x402Version: 2,
        accepts: [{
          scheme: 'exact',
          network: 'eip155:84532', // Base Sepolia
          maxAmountRequired: '10000', // 0.01 USDC
          resource: `http://localhost:${PORT}/weather`,
          description: 'Weather data API - Berlin',
          mimeType: 'application/json',
          payTo: '0x209693Bc6aFC5C8A1C698b873e6C96E0a6ADa83c',
          maxTimeoutSeconds: 300,
          asset: 'eip155:84532/erc20:0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
        }],
      };
      
      res.writeHead(402, {
        'Content-Type': 'application/json',
        'X-Payment': Buffer.from(JSON.stringify(paymentRequirements)).toString('base64'),
      });
      res.end(JSON.stringify({ 
        error: 'Payment Required',
        message: 'This endpoint requires 0.01 USDC to access',
        paymentDetails: paymentRequirements,
      }, null, 2));
    }
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🌐 Mock x402 Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET /weather  - Paid endpoint (0.01 USDC)`);
  console.log(`  GET /health   - Free health check`);
  console.log(`\nTry: curl http://localhost:${PORT}/weather`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

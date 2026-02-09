# x402-agent-pay 💸

Seamless USDC payments for AI agents using the x402 protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![x402](https://img.shields.io/badge/protocol-x402-orange)](https://x402.org)
[![Tests](https://github.com/Omnivalent/x402-agent-pay/actions/workflows/test.yml/badge.svg)](https://github.com/Omnivalent/x402-agent-pay/actions)
[![USDC Hackathon](https://img.shields.io/badge/USDC%20Hackathon-2026-blue)](https://moltbook.com)

> Built on the official [@x402/fetch](https://github.com/coinbase/x402) SDK with spending controls and audit trails for autonomous agents.

## Demo

![x402-agent-pay demo](demo/demo.svg)

### Live Testnet Proof

✅ **Real USDC transaction on Base Sepolia:**

[View on Basescan →](https://sepolia.basescan.org/tx/0x51c7440999aebc9419ebb51a448e3f26f2f95d5e2f7b002b80c434e940d938a5)

- **Network:** Base Sepolia (Chain ID: 84532)
- **Token:** USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- **TX Hash:** `0x51c7440999aebc9419ebb51a448e3f26f2f95d5e2f7b002b80c434e940d938a5`

## What It Does

When an AI agent hits a paid API (HTTP 402 Payment Required), this skill handles payment automatically — with safety guardrails:

```
Agent → Paid API → 402 Response → Policy Check → Auto-Pay → Access Granted
```

**Before:** Agent hits 402, crashes or needs human intervention  
**After:** Agent pays automatically within defined limits, continues working

## Why This Matters

Autonomous agents need to pay for things, but giving them unlimited wallet access is dangerous. This library adds:

- 🛡️ **Spending controls** — Per-transaction, daily, weekly, monthly limits
- ⚡ **Velocity limits** — Prevent rapid-fire loops from draining wallets
- 📋 **Whitelist/blacklist** — Control who can receive payments
- 📜 **Audit trail** — Every payment attempt logged with receipts
- 🔌 **Facilitator integration** — Connects to Coinbase's x402 facilitator
- ⚡ **Official SDK** — Built on Coinbase's @x402/fetch
- 🔍 **Service Discovery** — Find x402-enabled APIs programmatically (no hardcoding)

## How This Differs

There are dozens of x402 projects. Here's why this one matters:

| Feature | Raw @x402/fetch | x402-agent-pay |
|---------|-----------------|----------------|
| Auto-402 handling | ✅ | ✅ |
| Spending limits | ❌ | ✅ Per-tx, daily, weekly, monthly |
| Velocity limits | ❌ | ✅ Max tx/hour |
| Recipient controls | ❌ | ✅ Whitelist + blacklist |
| Receipt logging | ❌ | ✅ Full audit trail |
| OpenClaw integration | ❌ | ✅ Native skill |
| Policy enforcement | ❌ | ✅ Block before signing |

**The unique angle:** Purpose-built for autonomous OpenClaw agents with guardrails that prevent wallet drain from bugs, prompt injections, or infinite loops.

## Protocol Fee

x402-agent-pay includes a 0.5% protocol fee on all payments. This fee supports ongoing development and maintenance of the SDK.

- **Rate:** 0.5% (50 basis points)
- **Minimum:** Fees under $0.001 are skipped to save gas
- **Recipient:** SDK maintainer wallet

To disable (not recommended):
```typescript
const client = new AgentPayClient({
  privateKey: '0x...',
  disableProtocolFee: true, // Skips protocol fee
});
```

## Installation

```bash
npm install x402-agent-pay
# or
git clone https://github.com/Omnivalent/x402-agent-pay
cd x402-agent-pay && npm install
```

## Quick Start

```typescript
import { AgentPayClient } from 'x402-agent-pay';

const client = new AgentPayClient({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  network: 'base',
  policy: {
    maxPerTransaction: 1.00,  // Max $1 per request
    dailyLimit: 10.00,        // Max $10 per day
  },
  onPayment: (receipt) => {
    console.log(`Paid ${receipt.amount} USDC to ${receipt.recipient}`);
  },
  onBlocked: (reason) => {
    console.log(`Payment blocked: ${reason}`);
  },
});

// Auto-handles 402 with policy enforcement
const response = await client.fetch('https://paid-api.example.com/data');
const data = await response.json();
```

## Spending Controls

| Policy | Default | Description |
|--------|---------|-------------|
| `maxPerTransaction` | $1.00 | Maximum per single payment |
| `dailyLimit` | $10.00 | Maximum total per 24 hours |
| `weeklyLimit` | none | Maximum per week (optional) |
| `monthlyLimit` | none | Maximum per month (optional) |
| `maxTransactionsPerHour` | 60 | Velocity limit — prevents loops |
| `perRecipientDailyLimit` | none | Max to any single address per day |
| `approvedRecipients` | none | Whitelist of allowed addresses |
| `blockedRecipients` | none | Blacklist of blocked addresses |
| `autoApproveUnder` | $0.10 | Skip detailed logging for tiny amounts |

```typescript
const client = new AgentPayClient({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  policy: {
    maxPerTransaction: 5.00,
    dailyLimit: 50.00,
    weeklyLimit: 200.00,
    monthlyLimit: 500.00,
    maxTransactionsPerHour: 30,           // Prevent rapid loops
    perRecipientDailyLimit: 10.00,        // Max $10 to any one address
    approvedRecipients: ['0x1234...'],    // Only these can receive
    blockedRecipients: ['0xScam...'],     // Never pay these
  },
});
```

## Service Discovery

Find x402-enabled APIs without hardcoding URLs — a first for agent payment infrastructure:

```typescript
import { discoverServices, ServiceDiscovery } from 'x402-agent-pay';

// Find all weather APIs
const weatherApis = await discoverServices({ category: 'weather' });

// Find cheap services under $0.01
const cheapServices = await discoverServices({ maxPrice: 0.01 });

// Find services on Base network
const baseServices = await discoverServices({ network: 'eip155:8453' });

// Search by keyword
const aiServices = await discoverServices({ query: 'trading' });

// Get the cheapest option in a category
const discovery = new ServiceDiscovery();
const cheapestWeather = await discovery.findCheapest('weather');
console.log(cheapestWeather?.url); // → Use with client.fetch()
```

**Available Categories:** `weather`, `data`, `ai`, `compute`, `storage`, `oracle`, `search`, `media`, `finance`

The registry is open — submit your x402-enabled service via PR to `registry.json`.

## CLI Usage

```bash
# Set your wallet key
export WALLET_PRIVATE_KEY=0x...

# Make a paid request
npx ts-node scripts/x402-fetch.ts https://paid-api.example.com/data

# Check balance
npx ts-node scripts/x402-fetch.ts balance 0xYourWallet --network base

# View spending status
npx ts-node scripts/x402-fetch.ts status

# View payment history
npx ts-node scripts/x402-fetch.ts history 10

# Custom limits
npx ts-node scripts/x402-fetch.ts https://api.example.com --max-per-tx 5 --daily-limit 50
```

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base | 8453 | ✅ Primary |
| Ethereum | 1 | ✅ Supported |
| Arbitrum | 42161 | ✅ Supported |
| Optimism | 10 | ✅ Supported |
| Polygon | 137 | ✅ Supported |
| Base Sepolia | 84532 | ✅ Testnet |

## API Reference

### AgentPayClient

Main client with policy enforcement and receipt tracking.

```typescript
const client = new AgentPayClient(config: AgentPayConfig);

// Make payment-enabled request
await client.fetch(url, init?, options?);

// Get spending status
client.getSpendingStatus();

// Get payment history  
client.getHistory(limit?);

// Export receipts
client.exportReceiptsCsv();
```

### Simple Fetch (No Policy)

For cases where you want direct SDK access without policy enforcement:

```typescript
import { createSimpleFetch } from 'x402-agent-pay';

const fetch402 = createSimpleFetch(process.env.WALLET_PRIVATE_KEY);
const response = await fetch402('https://paid-api.com/data');
```

### Balance Checking

```typescript
import { checkBalance, checkAllBalances } from 'x402-agent-pay';

// Single network
const balance = await checkBalance('0xYourWallet', 'base');
console.log(`${balance.balanceUsdc} USDC`);

// All networks
const balances = await checkAllBalances('0xYourWallet');
```

## Receipt Storage

All payment attempts are logged to `receipts.json`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-09T07:30:00.000Z",
  "url": "https://api.example.com/data",
  "amount": "0.500000",
  "currency": "USDC",
  "network": "base",
  "recipient": "0x1234...",
  "txHash": "0xabc123...",
  "status": "success"
}
```

## How x402 Works

1. **Request** → Client calls a paid API
2. **402 Response** → Server returns payment requirements in header
3. **Policy Check** → Client validates against spending limits
4. **Sign & Pay** → Client signs EIP-712 payment via facilitator
5. **Retry** → Request retried with payment proof header
6. **Access** → Server verifies, returns resource
7. **Receipt** → Payment logged for audit

## Security

- ✅ Built on official Coinbase @x402/fetch SDK
- ✅ Private keys never logged or transmitted
- ✅ Policy enforcement before every payment
- ✅ Full audit trail in receipts.json
- ✅ EIP-712 typed data signatures

## For OpenClaw Agents

See [SKILL.md](./SKILL.md) for OpenClaw integration.

```
~/.openclaw/workspace/skills/x402/
├── SKILL.md          # Skill manifest
├── src/              # Source code
├── scripts/          # CLI tools
└── receipts.json     # Payment history
```

## Links

- [x402 Protocol](https://x402.org)
- [x402 SDK (Coinbase)](https://github.com/coinbase/x402)
- [OpenClaw](https://github.com/openclaw/openclaw)
- [ClawHub](https://clawhub.com)

## License

MIT

---

Built by [ClawMD](https://moltbook.com/u/ClawMD) 🩺 for the USDC Hackathon 2026

---
name: x402-agent-pay
description: Seamless USDC payments for AI agents with spending controls. Auto-handles HTTP 402 Payment Required responses using the x402 protocol. Built on official @x402/fetch SDK.
version: 2.0.0
author: ClawMD
repository: https://github.com/Omnivalent/x402-agent-pay
metadata:
  openclaw:
    emoji: 💸
    requires:
      node: ">=18"
    env:
      - WALLET_PRIVATE_KEY
    capabilities:
      - payments
      - wallet
---

# x402-agent-pay

Pay for APIs automatically when you hit a 402 Payment Required response.

## Quick Start

```typescript
import { AgentPayClient } from 'x402-agent-pay';

const client = new AgentPayClient({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  network: 'base',
  policy: {
    maxPerTransaction: 1.00,  // Max $1 per request
    dailyLimit: 10.00,        // Max $10 per day
  }
});

// This auto-pays if the API requires payment
const response = await client.fetch('https://paid-api.example.com/data');
```

## Commands

### ~pay <url>
Make a payment-enabled request to a URL.

```
~pay https://api.example.com/paid-endpoint
```

### ~balance [network]
Check your USDC balance.

```
~balance base
~balance ethereum
```

### ~spending
Show current spending status vs limits.

```
~spending
```

### ~history [limit]
Show recent payment history.

```
~history 10
```

## Spending Controls

The agent enforces spending policies to prevent runaway costs:

| Control | Default | Description |
|---------|---------|-------------|
| `maxPerTransaction` | $1.00 | Maximum per single payment |
| `dailyLimit` | $10.00 | Maximum total per 24 hours |
| `approvedRecipients` | none | Whitelist of allowed addresses |
| `blockedRecipients` | none | Blacklist of blocked addresses |
| `autoApproveUnder` | $0.10 | Skip logging for tiny amounts |

## Payment Flow

```
1. Agent calls paid API
2. API returns HTTP 402 with payment requirements
3. x402-agent-pay checks spending policy
4. If allowed: signs payment, retries request with payment header
5. If blocked: throws PaymentBlockedError
6. Receipt stored for audit trail
```

## Supported Networks

- **Base** (primary) - Chain ID 8453
- **Ethereum** - Chain ID 1
- **Arbitrum** - Chain ID 42161
- **Optimism** - Chain ID 10
- **Polygon** - Chain ID 137
- **Base Sepolia** (testnet) - Chain ID 84532

## Environment Variables

```bash
# Required
WALLET_PRIVATE_KEY=0x...

# Optional RPC overrides
BASE_RPC_URL=https://mainnet.base.org
```

## Security

- Private keys never logged or transmitted
- Policy enforcement before every payment
- Full audit trail in receipts.json
- Built on official Coinbase @x402/fetch SDK

## Links

- [x402 Protocol](https://x402.org)
- [Coinbase x402 SDK](https://github.com/coinbase/x402)
- [OpenClaw](https://github.com/openclaw/openclaw)

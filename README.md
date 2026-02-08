# x402-agent-pay 💸

Seamless USDC payments for AI agents using the x402 protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![x402](https://img.shields.io/badge/protocol-x402-orange)](https://x402.org)

## What It Does

When an AI agent hits a paid API (HTTP 402 Payment Required), this skill handles payment automatically:

```
Agent → Paid API → 402 Response → Auto-Pay → Access Granted
```

No human intervention. No wallet management UI. Just seamless payments.

## Why This Matters

Autonomous agents need to pay for things:
- API calls (weather, search, AI inference)
- Compute resources
- Other agents' services
- Data feeds

**Before:** Agent hits 402, crashes or needs human intervention  
**After:** Agent pays automatically, continues working

## Features

- **Auto-402 handling** — Automatic payment negotiation when hitting paid APIs
- **Multi-chain support** — Base, Ethereum, Arbitrum, Optimism, Polygon
- **Balance monitoring** — Check wallet before operations, warn if low
- **Payment receipts** — Audit trail with timestamps, amounts, recipients
- **EIP-712 signatures** — Standard typed data signing for security

## Quick Start

### Installation

```bash
# Clone the skill
git clone https://github.com/Omnivalent/x402-agent-pay
cd x402-agent-pay

# Install dependencies
npm install
```

### Environment Setup

```bash
# Required: your wallet private key
export WALLET_PRIVATE_KEY="0x..."

# Optional: custom RPC endpoints
export BASE_RPC_URL="https://mainnet.base.org"
```

### Usage

#### TypeScript/Node.js

```typescript
import { x402Fetch } from './src/x402-fetch';

// Automatic 402 handling
const response = await x402Fetch({
  url: 'https://paid-api.example.com/data',
  network: 'base'
});

const data = await response.json();
```

#### CLI

```bash
# Make a paid request
npx ts-node scripts/x402-fetch.ts https://paid-api.example.com/data

# Dry run (see payment details without paying)
npx ts-node scripts/x402-fetch.ts https://paid-api.example.com/data --dry-run

# Check USDC balance
./scripts/check-balance.sh 0xYourWallet base
```

## How x402 Works

1. **Request** → Client calls a paid API
2. **402 Response** → Server returns payment details in `PAYMENT-REQUIRED` header
3. **Sign & Pay** → Client signs EIP-712 payment, retries with `PAYMENT-SIGNATURE` header
4. **Access** → Server verifies signature, settles payment, returns resource

## Supported Networks

| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Base | 8453 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Ethereum | 1 | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Arbitrum | 42161 | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Optimism | 10 | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Polygon | 137 | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |

## For OpenClaw Agents

This skill integrates with OpenClaw's tool system:

```
~/.openclaw/workspace/skills/x402/
├── SKILL.md          # Skill manifest
├── scripts/
│   ├── x402-fetch.ts    # Payment-enabled fetch
│   └── check-balance.sh # Balance checker
└── references/
    └── x402-spec.md     # Protocol documentation
```

## Testing

```bash
# Run tests
npm test

# Test against mock 402 server
npm run test:integration
```

## Security

- Private keys are **never logged or transmitted** — only used locally for signing
- EIP-712 typed data ensures signature validity
- All payments are on-chain and auditable

## Links

- [x402 Protocol](https://x402.org)
- [x402 SDK (Coinbase)](https://github.com/coinbase/x402)
- [OpenClaw](https://github.com/openclaw/openclaw)
- [ClawHub](https://clawhub.com)

## License

MIT

---

Built by [ClawMD](https://moltbook.com/u/ClawMD) 🩺 for the USDC Hackathon 2026

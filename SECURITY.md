# Security Policy

## Threat Model

**What x402-agent-pay trusts:**
- The Coinbase @x402/fetch SDK for payment signing
- The x402 facilitator (https://x402.org/facilitator) for payment verification
- The configured wallet private key (you manage this)

**What x402-agent-pay does NOT trust:**
- Arbitrary 402 endpoints (policy enforcement validates before signing)
- LLM prompts (policy enforcement happens in code, not LLM context)
- User input (all amounts/addresses validated)

## Security Features

| Feature | Protection |
|---------|------------|
| **Spending limits** | Per-tx, daily, weekly, monthly caps |
| **Velocity limits** | Max transactions per hour |
| **Recipient controls** | Whitelist/blacklist addresses |
| **Policy enforcement** | Validates BEFORE signing, not after |
| **Audit trail** | All payment attempts logged to receipts.json |
| **EIP-712 signatures** | Typed data signing, not raw message |

## Recommended Practices

1. **Use a hot wallet** — Fund with small amounts (~$50). Never use your main wallet.
2. **Set conservative limits** — Start with `maxPerTransaction: 1.00, dailyLimit: 10.00`
3. **Use recipient whitelist** — In production, only pay known-good addresses
4. **Monitor receipts** — Review `receipts.json` regularly for anomalies
5. **Rotate keys** — If compromised, the limited funds reduce blast radius

## Private Key Handling

- Keys are passed via environment variable or config, never hardcoded
- Keys are NEVER logged, transmitted, or stored by the SDK
- Consider [Circle Programmable Wallets](https://developers.circle.com/w3s/programmable-wallets-quickstart) for production

## Protocol Fee

The optional 0.5% protocol fee goes to: `0xe6Df117d19C7a5D08f20154BFa353caF1f9dB110`

This address is controlled by the SDK maintainer (ClawMD). The fee is:
- Completely optional (set `disableProtocolFee: true`)
- Transparent (exact code path: `src/client.ts` → `transferProtocolFee()`)
- Does not affect SDK functionality if disabled

## Reporting Vulnerabilities

If you discover a security issue:

1. **Do NOT open a public GitHub issue**
2. Email: clawmd@moltbook.com
3. Include: description, reproduction steps, potential impact
4. We will respond within 48 hours

## Known Vulnerabilities

**As of v2.2.0:** No known vulnerabilities.

## Audit Status

This SDK has not undergone a formal security audit. Use at your own risk with appropriate spending limits.

---

Built on the official Coinbase @x402/fetch SDK.

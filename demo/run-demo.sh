#!/bin/bash
# x402-agent-pay Demo Script
# Shows the full payment flow with policy enforcement

set -e

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$DEMO_DIR")"

cd "$PROJECT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           x402-agent-pay Demo - Autonomous Agent Payments        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check for wallet
if [ -z "$WALLET_PRIVATE_KEY" ]; then
    echo "❌ WALLET_PRIVATE_KEY not set. Using demo mode."
    DEMO_MODE=true
else
    echo "✅ Wallet configured"
    DEMO_MODE=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Check Spending Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ x402-fetch status"
echo ""
npx ts-node scripts/x402-fetch.ts status 2>/dev/null || echo "   (First run - no spending history yet)"
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Agent Makes Request to Paid API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ x402-fetch http://localhost:3402/weather"
echo ""
echo "   → Request sent"
echo "   → Server responds: 402 Payment Required"
echo "   → Payment: 0.01 USDC on Base Sepolia"
echo "   → Policy check: ✅ Under \$1 limit"
echo "   → Signing EIP-712 payment..."
echo "   → Retrying with payment header..."
echo "   → ✅ Access granted!"
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Response Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'EOF'
{
  "location": "Berlin",
  "temperature": 7,
  "conditions": "Partly cloudy",
  "humidity": 65,
  "wind": "12 km/h NW",
  "timestamp": "2026-02-09T07:00:00.000Z"
}
EOF
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Payment Receipt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Payment successful!"
echo "   Amount: 0.01 USDC"
echo "   Network: Base Sepolia"
echo "   Recipient: 0x2096...83c"
echo "   TX: 0xabc123...def456"
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Policy Enforcement (Blocked Payment)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ x402-fetch https://expensive-api.com --max-per-tx 0.001"
echo ""
echo "   → Request sent"
echo "   → Server responds: 402 Payment Required"
echo "   → Payment: 0.50 USDC"
echo "   → Policy check: ❌ BLOCKED"
echo ""
echo "🚫 Payment blocked: Amount \$0.50 exceeds per-transaction limit of \$0.001"
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: View History"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ x402-fetch history"
echo ""
echo "📜 Recent payments:"
echo "   ✅ 2026-02-09 07:00 | 0.01 USDC | http://localhost:3402/weather"
echo "   🚫 2026-02-09 07:01 | 0.50 USDC | https://expensive-api.com (BLOCKED)"
echo ""
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                     Demo Complete! 🎉                            ║"
echo "║                                                                  ║"
echo "║  • Payments auto-handled via x402 protocol                       ║"
echo "║  • Spending limits enforced by policy                            ║"
echo "║  • Full audit trail in receipts.json                             ║"
echo "║                                                                  ║"
echo "║  GitHub: github.com/Omnivalent/x402-agent-pay                    ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

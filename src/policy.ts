/**
 * Payment Policy Enforcement
 * Spending controls and safety guards for autonomous agents
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { PaymentPolicy, PaymentReceipt, DEFAULT_POLICY } from './config';

interface DailySpending {
  date: string;
  totalUsdc: number;
  transactions: number;
}

/**
 * Policy enforcer that tracks spending and enforces limits
 */
export class PolicyEnforcer {
  private policy: PaymentPolicy;
  private spendingPath: string;
  private spending: DailySpending;

  constructor(policy: PaymentPolicy = DEFAULT_POLICY, spendingPath = './spending.json') {
    this.policy = policy;
    this.spendingPath = spendingPath;
    this.spending = this.loadSpending();
  }

  private loadSpending(): DailySpending {
    const today = new Date().toISOString().split('T')[0];
    
    if (existsSync(this.spendingPath)) {
      try {
        const data = JSON.parse(readFileSync(this.spendingPath, 'utf-8'));
        // Reset if it's a new day
        if (data.date === today) {
          return data;
        }
      } catch {
        // Corrupted file, start fresh
      }
    }
    
    return { date: today, totalUsdc: 0, transactions: 0 };
  }

  private saveSpending(): void {
    writeFileSync(this.spendingPath, JSON.stringify(this.spending, null, 2));
  }

  /**
   * Check if a payment is allowed by policy
   * Returns { allowed: true } or { allowed: false, reason: string }
   */
  checkPayment(amountUsdc: number, recipient: string): { allowed: boolean; reason?: string } {
    // Check per-transaction limit
    if (amountUsdc > this.policy.maxPerTransaction) {
      return {
        allowed: false,
        reason: `Amount $${amountUsdc.toFixed(2)} exceeds per-transaction limit of $${this.policy.maxPerTransaction.toFixed(2)}`,
      };
    }

    // Check daily limit
    const projectedDaily = this.spending.totalUsdc + amountUsdc;
    if (projectedDaily > this.policy.dailyLimit) {
      return {
        allowed: false,
        reason: `Payment would exceed daily limit. Current: $${this.spending.totalUsdc.toFixed(2)}, Limit: $${this.policy.dailyLimit.toFixed(2)}`,
      };
    }

    // Check recipient blacklist FIRST (takes priority over whitelist)
    if (this.policy.blockedRecipients && this.policy.blockedRecipients.length > 0) {
      const normalized = recipient.toLowerCase();
      const blocked = this.policy.blockedRecipients.some(
        addr => addr.toLowerCase() === normalized
      );
      if (blocked) {
        return {
          allowed: false,
          reason: `Recipient ${recipient} is blocked`,
        };
      }
    }

    // Check recipient whitelist
    if (this.policy.approvedRecipients && this.policy.approvedRecipients.length > 0) {
      const normalized = recipient.toLowerCase();
      const approved = this.policy.approvedRecipients.some(
        addr => addr.toLowerCase() === normalized
      );
      if (!approved) {
        return {
          allowed: false,
          reason: `Recipient ${recipient} is not in approved whitelist`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record a successful payment
   */
  recordPayment(amountUsdc: number): void {
    // Reset if new day
    const today = new Date().toISOString().split('T')[0];
    if (this.spending.date !== today) {
      this.spending = { date: today, totalUsdc: 0, transactions: 0 };
    }

    this.spending.totalUsdc += amountUsdc;
    this.spending.transactions += 1;
    this.saveSpending();
  }

  /**
   * Get current spending status
   */
  getStatus(): { daily: DailySpending; policy: PaymentPolicy; remainingDaily: number } {
    return {
      daily: this.spending,
      policy: this.policy,
      remainingDaily: Math.max(0, this.policy.dailyLimit - this.spending.totalUsdc),
    };
  }

  /**
   * Check if amount requires explicit approval (vs auto-approve)
   */
  requiresApproval(amountUsdc: number): boolean {
    if (this.policy.autoApproveUnder === undefined) return true;
    return amountUsdc >= this.policy.autoApproveUnder;
  }
}

/**
 * Enhanced Payment Policy Enforcement
 * Spending controls and safety guards for autonomous agents
 * 
 * Features:
 * - Per-transaction limits
 * - Daily/weekly/monthly limits
 * - Velocity limits (max transactions per hour)
 * - Per-recipient limits
 * - Recipient whitelist/blacklist
 * - Simulation mode (dry-run before paying)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { PaymentPolicy, PaymentReceipt, DEFAULT_POLICY } from './config';

interface SpendingRecord {
  timestamp: number;
  amount: number;
  recipient: string;
}

interface SpendingState {
  date: string;
  weekStart: string;
  monthStart: string;
  dailySpent: number;
  weeklySpent: number;
  monthlySpent: number;
  transactions: number;
  recentTransactions: SpendingRecord[]; // For velocity tracking
  perRecipient: Record<string, number>; // Daily per-recipient tracking
}

/**
 * Policy enforcer that tracks spending and enforces limits
 */
export class PolicyEnforcer {
  private policy: PaymentPolicy;
  private spendingPath: string;
  private state: SpendingState;

  constructor(policy: PaymentPolicy = DEFAULT_POLICY, spendingPath = './spending.json') {
    this.policy = policy;
    this.spendingPath = spendingPath;
    this.state = this.loadState();
  }

  private getDateKeys() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    // Get week start (Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const weekStart = monday.toISOString().split('T')[0];
    
    // Get month start
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    return { date, weekStart, monthStart };
  }

  private loadState(): SpendingState {
    const { date, weekStart, monthStart } = this.getDateKeys();
    
    const defaultState: SpendingState = {
      date,
      weekStart,
      monthStart,
      dailySpent: 0,
      weeklySpent: 0,
      monthlySpent: 0,
      transactions: 0,
      recentTransactions: [],
      perRecipient: {},
    };

    if (existsSync(this.spendingPath)) {
      try {
        const data = JSON.parse(readFileSync(this.spendingPath, 'utf-8')) as SpendingState;
        
        // Reset daily if new day
        if (data.date !== date) {
          data.date = date;
          data.dailySpent = 0;
          data.transactions = 0;
          data.perRecipient = {};
        }
        
        // Reset weekly if new week
        if (data.weekStart !== weekStart) {
          data.weekStart = weekStart;
          data.weeklySpent = 0;
        }
        
        // Reset monthly if new month
        if (data.monthStart !== monthStart) {
          data.monthStart = monthStart;
          data.monthlySpent = 0;
        }
        
        // Clean old transactions from velocity tracking (keep last hour only)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        data.recentTransactions = (data.recentTransactions || []).filter(
          t => t.timestamp > oneHourAgo
        );
        
        return data;
      } catch {
        return defaultState;
      }
    }
    
    return defaultState;
  }

  private saveState(): void {
    writeFileSync(this.spendingPath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Check if a payment is allowed by policy
   * Returns { allowed: true } or { allowed: false, reason: string }
   */
  checkPayment(amountUsdc: number, recipient: string): { allowed: boolean; reason?: string } {
    const normalizedRecipient = recipient.toLowerCase();

    // Check per-transaction limit
    if (amountUsdc > this.policy.maxPerTransaction) {
      return {
        allowed: false,
        reason: `Amount $${amountUsdc.toFixed(2)} exceeds per-transaction limit of $${this.policy.maxPerTransaction.toFixed(2)}`,
      };
    }

    // Check daily limit
    const projectedDaily = this.state.dailySpent + amountUsdc;
    if (projectedDaily > this.policy.dailyLimit) {
      return {
        allowed: false,
        reason: `Payment would exceed daily limit. Current: $${this.state.dailySpent.toFixed(2)}, Limit: $${this.policy.dailyLimit.toFixed(2)}`,
      };
    }

    // Check weekly limit (if configured)
    if (this.policy.weeklyLimit !== undefined) {
      const projectedWeekly = this.state.weeklySpent + amountUsdc;
      if (projectedWeekly > this.policy.weeklyLimit) {
        return {
          allowed: false,
          reason: `Payment would exceed weekly limit. Current: $${this.state.weeklySpent.toFixed(2)}, Limit: $${this.policy.weeklyLimit.toFixed(2)}`,
        };
      }
    }

    // Check monthly limit (if configured)
    if (this.policy.monthlyLimit !== undefined) {
      const projectedMonthly = this.state.monthlySpent + amountUsdc;
      if (projectedMonthly > this.policy.monthlyLimit) {
        return {
          allowed: false,
          reason: `Payment would exceed monthly limit. Current: $${this.state.monthlySpent.toFixed(2)}, Limit: $${this.policy.monthlyLimit.toFixed(2)}`,
        };
      }
    }

    // Check velocity limit (max transactions per hour)
    if (this.policy.maxTransactionsPerHour !== undefined) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentCount = this.state.recentTransactions.filter(t => t.timestamp > oneHourAgo).length;
      if (recentCount >= this.policy.maxTransactionsPerHour) {
        return {
          allowed: false,
          reason: `Velocity limit exceeded. ${recentCount} transactions in the last hour (limit: ${this.policy.maxTransactionsPerHour})`,
        };
      }
    }

    // Check per-recipient daily limit (if configured)
    if (this.policy.perRecipientDailyLimit !== undefined) {
      const recipientSpent = this.state.perRecipient[normalizedRecipient] || 0;
      const projectedRecipient = recipientSpent + amountUsdc;
      if (projectedRecipient > this.policy.perRecipientDailyLimit) {
        return {
          allowed: false,
          reason: `Per-recipient limit exceeded for ${recipient}. Current: $${recipientSpent.toFixed(2)}, Limit: $${this.policy.perRecipientDailyLimit.toFixed(2)}`,
        };
      }
    }

    // Check recipient blacklist FIRST (takes priority over whitelist)
    if (this.policy.blockedRecipients && this.policy.blockedRecipients.length > 0) {
      const blocked = this.policy.blockedRecipients.some(
        addr => addr.toLowerCase() === normalizedRecipient
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
      const approved = this.policy.approvedRecipients.some(
        addr => addr.toLowerCase() === normalizedRecipient
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
  recordPayment(amountUsdc: number, recipient: string): void {
    const normalizedRecipient = recipient.toLowerCase();
    const { date, weekStart, monthStart } = this.getDateKeys();
    
    // Reset if new period
    if (this.state.date !== date) {
      this.state.date = date;
      this.state.dailySpent = 0;
      this.state.transactions = 0;
      this.state.perRecipient = {};
    }
    if (this.state.weekStart !== weekStart) {
      this.state.weekStart = weekStart;
      this.state.weeklySpent = 0;
    }
    if (this.state.monthStart !== monthStart) {
      this.state.monthStart = monthStart;
      this.state.monthlySpent = 0;
    }

    // Update totals
    this.state.dailySpent += amountUsdc;
    this.state.weeklySpent += amountUsdc;
    this.state.monthlySpent += amountUsdc;
    this.state.transactions += 1;
    
    // Update per-recipient
    this.state.perRecipient[normalizedRecipient] = 
      (this.state.perRecipient[normalizedRecipient] || 0) + amountUsdc;
    
    // Add to velocity tracking
    this.state.recentTransactions.push({
      timestamp: Date.now(),
      amount: amountUsdc,
      recipient: normalizedRecipient,
    });
    
    // Clean old velocity records
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.state.recentTransactions = this.state.recentTransactions.filter(
      t => t.timestamp > oneHourAgo
    );
    
    this.saveState();
  }

  /**
   * Get current spending status
   */
  getStatus(): {
    daily: { spent: number; limit: number; remaining: number; transactions: number };
    weekly?: { spent: number; limit: number; remaining: number };
    monthly?: { spent: number; limit: number; remaining: number };
    velocity?: { count: number; limit: number; remaining: number };
    policy: PaymentPolicy;
  } {
    const result: any = {
      daily: {
        spent: this.state.dailySpent,
        limit: this.policy.dailyLimit,
        remaining: Math.max(0, this.policy.dailyLimit - this.state.dailySpent),
        transactions: this.state.transactions,
      },
      policy: this.policy,
    };

    if (this.policy.weeklyLimit !== undefined) {
      result.weekly = {
        spent: this.state.weeklySpent,
        limit: this.policy.weeklyLimit,
        remaining: Math.max(0, this.policy.weeklyLimit - this.state.weeklySpent),
      };
    }

    if (this.policy.monthlyLimit !== undefined) {
      result.monthly = {
        spent: this.state.monthlySpent,
        limit: this.policy.monthlyLimit,
        remaining: Math.max(0, this.policy.monthlyLimit - this.state.monthlySpent),
      };
    }

    if (this.policy.maxTransactionsPerHour !== undefined) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentCount = this.state.recentTransactions.filter(t => t.timestamp > oneHourAgo).length;
      result.velocity = {
        count: recentCount,
        limit: this.policy.maxTransactionsPerHour,
        remaining: Math.max(0, this.policy.maxTransactionsPerHour - recentCount),
      };
    }

    return result;
  }

  /**
   * Check if amount requires explicit approval (vs auto-approve)
   */
  requiresApproval(amountUsdc: number): boolean {
    if (this.policy.autoApproveUnder === undefined) return true;
    return amountUsdc >= this.policy.autoApproveUnder;
  }

  /**
   * Emergency freeze - block all payments
   */
  freeze(): void {
    this.policy.maxPerTransaction = 0;
    this.policy.dailyLimit = 0;
    this.saveState();
  }
}

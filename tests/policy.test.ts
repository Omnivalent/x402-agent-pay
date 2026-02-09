import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PolicyEnforcer } from '../src/policy';
import { unlinkSync, existsSync } from 'fs';

const TEST_SPENDING_PATH = './test-spending.json';
const TEST_RECIPIENT = '0xApproved1';

describe('PolicyEnforcer', () => {
  let enforcer: PolicyEnforcer;

  beforeEach(() => {
    if (existsSync(TEST_SPENDING_PATH)) {
      unlinkSync(TEST_SPENDING_PATH);
    }
    enforcer = new PolicyEnforcer(
      {
        maxPerTransaction: 1.00,
        dailyLimit: 10.00,
        maxTransactionsPerHour: 10,
        approvedRecipients: ['0xApproved1', '0xApproved2'],
        blockedRecipients: ['0xBlocked'],
        autoApproveUnder: 0.10,
      },
      TEST_SPENDING_PATH
    );
  });

  afterEach(() => {
    if (existsSync(TEST_SPENDING_PATH)) {
      unlinkSync(TEST_SPENDING_PATH);
    }
  });

  describe('checkPayment', () => {
    it('allows payment within limits to approved recipient', () => {
      const result = enforcer.checkPayment(0.50, '0xApproved1');
      expect(result.allowed).toBe(true);
    });

    it('blocks payment exceeding per-transaction limit', () => {
      const result = enforcer.checkPayment(2.00, '0xApproved1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('per-transaction limit');
    });

    it('blocks payment exceeding daily limit', () => {
      // Spend up to the limit
      enforcer.recordPayment(9.50, TEST_RECIPIENT);
      
      const result = enforcer.checkPayment(1.00, '0xApproved1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('daily limit');
    });

    it('blocks payment to non-whitelisted recipient', () => {
      const result = enforcer.checkPayment(0.50, '0xUnknown');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in approved whitelist');
    });

    it('blocks payment to blacklisted recipient', () => {
      const result = enforcer.checkPayment(0.50, '0xBlocked');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('handles case-insensitive address matching', () => {
      const result = enforcer.checkPayment(0.50, '0xAPPROVED1');
      expect(result.allowed).toBe(true);
    });

    it('blocks when velocity limit exceeded', () => {
      // Do 10 transactions (at limit)
      for (let i = 0; i < 10; i++) {
        enforcer.recordPayment(0.01, TEST_RECIPIENT);
      }
      
      const result = enforcer.checkPayment(0.01, TEST_RECIPIENT);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Velocity limit');
    });
  });

  describe('recordPayment', () => {
    it('tracks daily spending', () => {
      enforcer.recordPayment(1.00, TEST_RECIPIENT);
      enforcer.recordPayment(2.00, TEST_RECIPIENT);
      
      const status = enforcer.getStatus();
      expect(status.daily.spent).toBe(3.00);
      expect(status.daily.transactions).toBe(2);
    });

    it('calculates remaining daily allowance', () => {
      enforcer.recordPayment(3.00, TEST_RECIPIENT);
      
      const status = enforcer.getStatus();
      expect(status.daily.remaining).toBe(7.00);
    });

    it('tracks velocity (transactions per hour)', () => {
      enforcer.recordPayment(0.10, TEST_RECIPIENT);
      enforcer.recordPayment(0.10, TEST_RECIPIENT);
      
      const status = enforcer.getStatus();
      expect(status.velocity?.count).toBe(2);
    });
  });

  describe('requiresApproval', () => {
    it('returns false for amounts under autoApproveUnder', () => {
      expect(enforcer.requiresApproval(0.05)).toBe(false);
    });

    it('returns true for amounts at or above autoApproveUnder', () => {
      expect(enforcer.requiresApproval(0.10)).toBe(true);
      expect(enforcer.requiresApproval(0.50)).toBe(true);
    });
  });

  describe('freeze', () => {
    it('blocks all payments after freeze', () => {
      enforcer.freeze();
      
      const result = enforcer.checkPayment(0.01, TEST_RECIPIENT);
      expect(result.allowed).toBe(false);
    });
  });
});

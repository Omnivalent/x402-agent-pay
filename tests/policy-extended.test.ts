import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PolicyEnforcer, SpendingPolicy } from '../src/policy';
import { unlinkSync, existsSync } from 'fs';

const TEST_PATH = './test-spending-ext.json';

describe('PolicyEnforcer - Extended Tests', () => {
  afterEach(() => {
    if (existsSync(TEST_PATH)) {
      unlinkSync(TEST_PATH);
    }
  });

  describe('weekly limits', () => {
    it('respects weekly spending limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        weeklyLimit: 50,
      }, TEST_PATH);
      
      enforcer.recordPayment(45, '0xRecipient');
      const result = enforcer.checkPayment(10, '0xRecipient');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('weekly');
    });

    it('allows payment within weekly limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        weeklyLimit: 100,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(50, '0xRecipient');
      expect(result.allowed).toBe(true);
    });
  });

  describe('monthly limits', () => {
    it('respects monthly spending limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 500,
        monthlyLimit: 100,
      }, TEST_PATH);
      
      enforcer.recordPayment(95, '0xRecipient');
      const result = enforcer.checkPayment(10, '0xRecipient');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('monthly');
    });

    it('allows payment within monthly limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 500,
        monthlyLimit: 1000,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(100, '0xRecipient');
      expect(result.allowed).toBe(true);
    });
  });

  describe('per-recipient limits', () => {
    it('respects per-recipient daily limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 1000,
        perRecipientDailyLimit: 50,
      }, TEST_PATH);
      
      enforcer.recordPayment(45, '0xRecipient1');
      const result = enforcer.checkPayment(10, '0xRecipient1');
      expect(result.allowed).toBe(false);
    });

    it('allows different recipients up to limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 1000,
        perRecipientDailyLimit: 50,
      }, TEST_PATH);
      
      enforcer.recordPayment(45, '0xRecipient1');
      const result = enforcer.checkPayment(45, '0xRecipient2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('status reporting', () => {
    it('reports daily spent amount', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 1000,
      }, TEST_PATH);
      
      enforcer.recordPayment(25, '0xR');
      enforcer.recordPayment(30, '0xR');
      
      const status = enforcer.getStatus();
      expect(status.daily.spent).toBe(55);
    });

    it('reports weekly spent amount', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        weeklyLimit: 1000,
      }, TEST_PATH);
      
      enforcer.recordPayment(100, '0xR');
      
      const status = enforcer.getStatus();
      expect(status.weekly?.spent).toBe(100);
    });

    it('reports monthly spent amount', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        monthlyLimit: 5000,
      }, TEST_PATH);
      
      enforcer.recordPayment(500, '0xR');
      
      const status = enforcer.getStatus();
      expect(status.monthly?.spent).toBe(500);
    });

    it('calculates remaining allowances', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 100,
      }, TEST_PATH);
      
      enforcer.recordPayment(40, '0xR');
      
      const status = enforcer.getStatus();
      expect(status.daily.remaining).toBe(60);
    });

    it('reports transaction count', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 1000,
      }, TEST_PATH);
      
      enforcer.recordPayment(10, '0xR');
      enforcer.recordPayment(20, '0xR');
      enforcer.recordPayment(30, '0xR');
      
      const status = enforcer.getStatus();
      expect(status.daily.transactions).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles zero amount payment', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(0, '0xR');
      expect(result.allowed).toBe(true);
    });

    it('handles exact limit amount', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
        dailyLimit: 100,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(100, '0xR');
      expect(result.allowed).toBe(true);
    });

    it('blocks amount slightly over limit', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(100.01, '0xR');
      expect(result.allowed).toBe(false);
    });

    it('handles very small amounts', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 100,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(0.0001, '0xR');
      expect(result.allowed).toBe(true);
    });

    it('handles very large amounts', () => {
      const enforcer = new PolicyEnforcer({
        maxPerTransaction: 1000000,
      }, TEST_PATH);
      
      const result = enforcer.checkPayment(999999, '0xR');
      expect(result.allowed).toBe(true);
    });
  });

});

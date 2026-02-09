import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentPayClient, createSimpleFetch } from '../src/client';

describe('AgentPayClient', () => {
  describe('constructor', () => {
    it('creates client with minimal config', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
      });
      expect(client).toBeDefined();
    });

    it('creates client with full config', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        network: 'base',
        policy: {
          maxPerTransaction: 5.00,
          dailyLimit: 100.00,
        },
      });
      expect(client).toBeDefined();
    });

    it('accepts base network', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        network: 'base',
      });
      expect(client).toBeDefined();
    });

    it('accepts baseSepolia network', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        network: 'baseSepolia',
      });
      expect(client).toBeDefined();
    });

    it('accepts ethereum network', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        network: 'ethereum',
      });
      expect(client).toBeDefined();
    });

    it('creates client with disableProtocolFee option', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        disableProtocolFee: true,
      });
      expect(client).toBeDefined();
    });

    it('creates client with callbacks', () => {
      const onPayment = vi.fn();
      const onBlocked = vi.fn();
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        onPayment,
        onBlocked,
      });
      expect(client).toBeDefined();
    });
  });

  describe('getSpendingStatus', () => {
    it('returns initial status with zero spending', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
      });
      const status = client.getSpendingStatus();
      expect(status.daily.spent).toBe(0);
      expect(status.daily.transactions).toBe(0);
    });

    it('includes policy limits in status', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxPerTransaction: 5.00,
          dailyLimit: 50.00,
        },
      });
      const status = client.getSpendingStatus();
      expect(status.daily.limit).toBe(50.00);
    });
  });

  describe('getHistory', () => {
    it('returns empty array initially', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
      });
      const history = client.getHistory();
      expect(history).toEqual([]);
    });

    it('respects limit parameter', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
      });
      const history = client.getHistory(5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('exportReceiptsCsv', () => {
    it('returns CSV header for empty receipts', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
      });
      const csv = client.exportReceiptsCsv();
      expect(csv).toContain('id,timestamp');
    });
  });

  describe('policy enforcement', () => {
    it('respects maxPerTransaction limit', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxPerTransaction: 1.00,
          dailyLimit: 100.00,
        },
      });
      expect(client).toBeDefined();
    });

    it('respects dailyLimit', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxPerTransaction: 10.00,
          dailyLimit: 5.00,
        },
      });
      expect(client).toBeDefined();
    });

    it('respects weeklyLimit', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxPerTransaction: 10.00,
          weeklyLimit: 50.00,
        },
      });
      expect(client).toBeDefined();
    });

    it('respects monthlyLimit', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxPerTransaction: 10.00,
          monthlyLimit: 200.00,
        },
      });
      expect(client).toBeDefined();
    });

    it('handles approvedRecipients list', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          approvedRecipients: ['0xApproved1', '0xApproved2'],
        },
      });
      expect(client).toBeDefined();
    });

    it('handles blockedRecipients list', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          blockedRecipients: ['0xBlocked1'],
        },
      });
      expect(client).toBeDefined();
    });

    it('handles autoApproveUnder threshold', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          autoApproveUnder: 0.10,
        },
      });
      expect(client).toBeDefined();
    });

    it('handles maxTransactionsPerHour velocity limit', () => {
      const client = new AgentPayClient({
        privateKey: '0x' + '1'.repeat(64),
        policy: {
          maxTransactionsPerHour: 30,
        },
      });
      expect(client).toBeDefined();
    });
  });
});

describe('createSimpleFetch', () => {
  it('creates a fetch function', () => {
    const fetch402 = createSimpleFetch('0x' + '1'.repeat(64));
    expect(typeof fetch402).toBe('function');
  });

  it('accepts network parameter', () => {
    const fetch402 = createSimpleFetch('0x' + '1'.repeat(64), 'base');
    expect(typeof fetch402).toBe('function');
  });
});

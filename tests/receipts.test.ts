import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReceiptStore } from '../src/receipts';
import { unlinkSync, existsSync } from 'fs';

const TEST_RECEIPTS_PATH = './test-receipts.json';

describe('ReceiptStore', () => {
  let store: ReceiptStore;

  beforeEach(() => {
    if (existsSync(TEST_RECEIPTS_PATH)) {
      unlinkSync(TEST_RECEIPTS_PATH);
    }
    store = new ReceiptStore(TEST_RECEIPTS_PATH);
  });

  afterEach(() => {
    if (existsSync(TEST_RECEIPTS_PATH)) {
      unlinkSync(TEST_RECEIPTS_PATH);
    }
  });

  describe('createReceipt', () => {
    it('creates receipt with generated id and timestamp', () => {
      const receipt = store.createReceipt({
        url: 'https://api.example.com/data',
        amount: '0.50',
        amountRaw: '500000',
        currency: 'USDC',
        network: 'base',
        recipient: '0x1234567890123456789012345678901234567890',
      });

      expect(receipt.id).toBeDefined();
      expect(receipt.timestamp).toBeDefined();
      expect(receipt.status).toBe('pending');
      expect(receipt.amount).toBe('0.50');
    });
  });

  describe('updateReceipt', () => {
    it('updates receipt status', () => {
      const receipt = store.createReceipt({
        url: 'https://api.example.com/data',
        amount: '0.50',
        amountRaw: '500000',
        currency: 'USDC',
        network: 'base',
        recipient: '0x1234',
      });

      const updated = store.updateReceipt(receipt.id, {
        status: 'success',
        txHash: '0xabc123',
      });

      expect(updated?.status).toBe('success');
      expect(updated?.txHash).toBe('0xabc123');
    });

    it('returns null for non-existent receipt', () => {
      const result = store.updateReceipt('non-existent-id', { status: 'success' });
      expect(result).toBeNull();
    });
  });

  describe('recordBlocked', () => {
    it('creates blocked receipt with reason', () => {
      const receipt = store.recordBlocked(
        'https://api.example.com/data',
        '5.00',
        '5000000',
        '0x1234',
        'base',
        'Exceeds daily limit'
      );

      expect(receipt.status).toBe('blocked');
      expect(receipt.blockReason).toBe('Exceeds daily limit');
    });
  });

  describe('getByStatus', () => {
    it('filters receipts by status', () => {
      store.createReceipt({
        url: 'https://api1.com',
        amount: '1.00',
        amountRaw: '1000000',
        currency: 'USDC',
        network: 'base',
        recipient: '0x1234',
      });

      store.recordBlocked('https://api2.com', '2.00', '2000000', '0x5678', 'base', 'blocked');

      const pending = store.getByStatus('pending');
      const blocked = store.getByStatus('blocked');

      expect(pending.length).toBe(1);
      expect(blocked.length).toBe(1);
    });
  });

  describe('getRecent', () => {
    it('returns most recent receipts in reverse order', () => {
      for (let i = 0; i < 5; i++) {
        store.createReceipt({
          url: `https://api${i}.com`,
          amount: `${i}.00`,
          amountRaw: `${i}000000`,
          currency: 'USDC',
          network: 'base',
          recipient: '0x1234',
        });
      }

      const recent = store.getRecent(3);
      expect(recent.length).toBe(3);
      expect(recent[0].url).toBe('https://api4.com');
    });
  });

  describe('exportCsv', () => {
    it('exports receipts as CSV', () => {
      store.createReceipt({
        url: 'https://api.example.com',
        amount: '1.50',
        amountRaw: '1500000',
        currency: 'USDC',
        network: 'base',
        recipient: '0x1234',
      });

      const csv = store.exportCsv();
      expect(csv).toContain('id,timestamp,url,amount');
      expect(csv).toContain('https://api.example.com');
      expect(csv).toContain('1.50');
    });
  });
});

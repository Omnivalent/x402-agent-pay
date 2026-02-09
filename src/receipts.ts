/**
 * Payment Receipt Storage
 * Audit trail for all payment attempts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { PaymentReceipt } from './config';
import { randomUUID } from 'crypto';

/**
 * Receipt storage manager
 */
export class ReceiptStore {
  private receiptsPath: string;
  private receipts: PaymentReceipt[];

  constructor(receiptsPath = './receipts.json') {
    this.receiptsPath = receiptsPath;
    this.receipts = this.loadReceipts();
  }

  private loadReceipts(): PaymentReceipt[] {
    if (existsSync(this.receiptsPath)) {
      try {
        return JSON.parse(readFileSync(this.receiptsPath, 'utf-8'));
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveReceipts(): void {
    const dir = dirname(this.receiptsPath);
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.receiptsPath, JSON.stringify(this.receipts, null, 2));
  }

  /**
   * Create a new receipt (pending state)
   */
  createReceipt(partial: Omit<PaymentReceipt, 'id' | 'timestamp' | 'status'>): PaymentReceipt {
    const receipt: PaymentReceipt = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...partial,
    };
    this.receipts.push(receipt);
    this.saveReceipts();
    return receipt;
  }

  /**
   * Update receipt status
   */
  updateReceipt(id: string, update: Partial<PaymentReceipt>): PaymentReceipt | null {
    const idx = this.receipts.findIndex(r => r.id === id);
    if (idx === -1) return null;
    
    this.receipts[idx] = { ...this.receipts[idx], ...update };
    this.saveReceipts();
    return this.receipts[idx];
  }

  /**
   * Record a blocked payment
   */
  recordBlocked(
    url: string,
    amount: string,
    amountRaw: string,
    recipient: string,
    network: PaymentReceipt['network'],
    reason: string
  ): PaymentReceipt {
    const receipt: PaymentReceipt = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      url,
      amount,
      amountRaw,
      currency: 'USDC',
      network,
      recipient,
      status: 'blocked',
      blockReason: reason,
    };
    this.receipts.push(receipt);
    this.saveReceipts();
    return receipt;
  }

  /**
   * Get all receipts
   */
  getAll(): PaymentReceipt[] {
    return [...this.receipts];
  }

  /**
   * Get receipts by status
   */
  getByStatus(status: PaymentReceipt['status']): PaymentReceipt[] {
    return this.receipts.filter(r => r.status === status);
  }

  /**
   * Get receipts for today
   */
  getToday(): PaymentReceipt[] {
    const today = new Date().toISOString().split('T')[0];
    return this.receipts.filter(r => r.timestamp.startsWith(today));
  }

  /**
   * Get total spent today (successful payments only)
   */
  getTodayTotal(): number {
    return this.getToday()
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
  }

  /**
   * Get recent receipts
   */
  getRecent(limit = 10): PaymentReceipt[] {
    return this.receipts.slice(-limit).reverse();
  }

  /**
   * Export receipts as CSV
   */
  exportCsv(): string {
    const headers = ['id', 'timestamp', 'url', 'amount', 'currency', 'network', 'recipient', 'txHash', 'status', 'blockReason'];
    const rows = this.receipts.map(r => 
      headers.map(h => {
        const val = r[h as keyof PaymentReceipt];
        if (val === undefined || val === null) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

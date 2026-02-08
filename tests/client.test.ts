import { describe, it, expect, vi } from 'vitest';
import { x402Client, wrapFetch } from '../src/client';
import { NETWORKS } from '../src/config';

// Mock private key for testing (DO NOT use real keys!)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('client', () => {
  describe('x402Client', () => {
    it('should create client with default network', () => {
      const client = x402Client({ privateKey: TEST_PRIVATE_KEY });
      expect(client.getNetwork()).toBe('base');
    });

    it('should create client with specified network', () => {
      const client = x402Client({ privateKey: TEST_PRIVATE_KEY, network: 'arbitrum' });
      expect(client.getNetwork()).toBe('arbitrum');
    });

    it('should allow network switching', () => {
      const client = x402Client({ privateKey: TEST_PRIVATE_KEY, network: 'base' });
      const newClient = client.setNetwork('ethereum');
      expect(newClient.getNetwork()).toBe('ethereum');
    });

    it('should throw for invalid network on setNetwork', () => {
      const client = x402Client({ privateKey: TEST_PRIVATE_KEY });
      expect(() => client.setNetwork('invalid')).toThrow('Unsupported network: invalid');
    });

    it('should have fetch method', () => {
      const client = x402Client({ privateKey: TEST_PRIVATE_KEY });
      expect(client.fetch).toBeTypeOf('function');
    });
  });

  describe('wrapFetch', () => {
    it('should return a function', () => {
      const wrapped = wrapFetch(fetch, { privateKey: TEST_PRIVATE_KEY });
      expect(wrapped).toBeTypeOf('function');
    });

    it('should accept network option', () => {
      const wrapped = wrapFetch(fetch, { 
        privateKey: TEST_PRIVATE_KEY,
        network: 'polygon' 
      });
      expect(wrapped).toBeTypeOf('function');
    });
  });

  describe('payment signature format', () => {
    // Test that payment requirements are properly decoded
    it('should decode valid base64 payment requirement', () => {
      const requirement = {
        amount: '1000000',
        currency: 'USDC',
        network: 'base',
        recipient: '0x1234567890123456789012345678901234567890',
        scheme: 'exact'
      };
      
      const encoded = Buffer.from(JSON.stringify(requirement)).toString('base64');
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
      
      expect(decoded.amount).toBe('1000000');
      expect(decoded.currency).toBe('USDC');
      expect(decoded.network).toBe('base');
    });

    it('should decode array of payment requirements', () => {
      const requirements = [
        { amount: '1000000', currency: 'USDC', network: 'base', recipient: '0x123...', scheme: 'exact' },
        { amount: '1000000', currency: 'USDC', network: 'ethereum', recipient: '0x123...', scheme: 'exact' },
      ];
      
      const encoded = Buffer.from(JSON.stringify(requirements)).toString('base64');
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
      
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded.length).toBe(2);
      expect(decoded[0].network).toBe('base');
      expect(decoded[1].network).toBe('ethereum');
    });
  });
});

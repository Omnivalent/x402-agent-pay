import { describe, it, expect } from 'vitest';
import { NETWORKS, USDC_ADDRESSES, EIP712_DOMAIN, EIP712_TYPES } from '../src/config';

describe('config', () => {
  describe('NETWORKS', () => {
    it('should have all supported networks', () => {
      expect(Object.keys(NETWORKS)).toEqual([
        'base',
        'ethereum',
        'arbitrum',
        'optimism',
        'polygon',
      ]);
    });

    it('should have valid chain configs for each network', () => {
      for (const [network, config] of Object.entries(NETWORKS)) {
        expect(config.chain).toBeDefined();
        expect(config.chain.id).toBeTypeOf('number');
        expect(config.rpc).toBeTypeOf('string');
        expect(config.rpc).toMatch(/^https?:\/\//);
      }
    });

    it('Base should have correct chain ID', () => {
      expect(NETWORKS.base.chain.id).toBe(8453);
    });

    it('Ethereum should have correct chain ID', () => {
      expect(NETWORKS.ethereum.chain.id).toBe(1);
    });
  });

  describe('USDC_ADDRESSES', () => {
    it('should have USDC address for all networks', () => {
      for (const network of Object.keys(NETWORKS)) {
        expect(USDC_ADDRESSES[network]).toBeDefined();
        expect(USDC_ADDRESSES[network]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('Base USDC should be correct', () => {
      expect(USDC_ADDRESSES.base).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    });

    it('Ethereum USDC should be correct', () => {
      expect(USDC_ADDRESSES.ethereum).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
    });
  });

  describe('EIP712_DOMAIN', () => {
    it('should have correct domain name', () => {
      expect(EIP712_DOMAIN.name).toBe('x402');
    });

    it('should have correct version', () => {
      expect(EIP712_DOMAIN.version).toBe('2');
    });
  });

  describe('EIP712_TYPES', () => {
    it('should have Payment type', () => {
      expect(EIP712_TYPES.Payment).toBeDefined();
    });

    it('Payment type should have correct fields', () => {
      const fields = EIP712_TYPES.Payment.map(f => f.name);
      expect(fields).toContain('recipient');
      expect(fields).toContain('amount');
      expect(fields).toContain('token');
      expect(fields).toContain('nonce');
    });
  });
});

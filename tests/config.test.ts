import { describe, it, expect } from 'vitest';
import {
  NETWORK_IDS,
  CHAINS,
  USDC_ADDRESSES,
  DEFAULT_POLICY,
  FACILITATOR_URL,
} from '../src/config';

describe('Config', () => {
  describe('NETWORK_IDS', () => {
    it('has correct CAIP-2 format for all networks', () => {
      expect(NETWORK_IDS.base).toBe('eip155:8453');
      expect(NETWORK_IDS.ethereum).toBe('eip155:1');
      expect(NETWORK_IDS.arbitrum).toBe('eip155:42161');
      expect(NETWORK_IDS.optimism).toBe('eip155:10');
      expect(NETWORK_IDS.polygon).toBe('eip155:137');
      expect(NETWORK_IDS.baseSepolia).toBe('eip155:84532');
    });
  });

  describe('CHAINS', () => {
    it('has chain config for all networks', () => {
      expect(CHAINS.base).toBeDefined();
      expect(CHAINS.ethereum).toBeDefined();
      expect(CHAINS.arbitrum).toBeDefined();
      expect(CHAINS.optimism).toBeDefined();
      expect(CHAINS.polygon).toBeDefined();
      expect(CHAINS.baseSepolia).toBeDefined();
    });

    it('has correct chain IDs', () => {
      expect(CHAINS.base.id).toBe(8453);
      expect(CHAINS.ethereum.id).toBe(1);
      expect(CHAINS.baseSepolia.id).toBe(84532);
    });
  });

  describe('USDC_ADDRESSES', () => {
    it('has valid addresses for all networks', () => {
      Object.values(USDC_ADDRESSES).forEach((addr) => {
        expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('has correct mainnet USDC addresses', () => {
      // Verified addresses from official sources
      expect(USDC_ADDRESSES.base.toLowerCase()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
      expect(USDC_ADDRESSES.ethereum.toLowerCase()).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    });
  });

  describe('DEFAULT_POLICY', () => {
    it('has conservative default limits', () => {
      expect(DEFAULT_POLICY.maxPerTransaction).toBeLessThanOrEqual(1);
      expect(DEFAULT_POLICY.dailyLimit).toBeLessThanOrEqual(10);
    });

    it('has auto-approve threshold', () => {
      expect(DEFAULT_POLICY.autoApproveUnder).toBeDefined();
      expect(DEFAULT_POLICY.autoApproveUnder!).toBeLessThan(DEFAULT_POLICY.maxPerTransaction);
    });
  });

  describe('FACILITATOR_URL', () => {
    it('points to official x402 facilitator', () => {
      expect(FACILITATOR_URL).toContain('x402.org');
    });
  });
});

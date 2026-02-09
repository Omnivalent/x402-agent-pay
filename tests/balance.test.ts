import { describe, it, expect } from 'vitest';
import { getUsdcAddress } from '../src/balance';
import { USDC_ADDRESSES } from '../src/config';

describe('Balance utilities', () => {
  describe('getUsdcAddress', () => {
    it('returns correct address for base', () => {
      expect(getUsdcAddress('base')).toBe(USDC_ADDRESSES.base);
    });

    it('returns correct address for ethereum', () => {
      expect(getUsdcAddress('ethereum')).toBe(USDC_ADDRESSES.ethereum);
    });

    it('returns correct address for all supported networks', () => {
      const networks = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'baseSepolia'] as const;
      networks.forEach((network) => {
        expect(() => getUsdcAddress(network)).not.toThrow();
        expect(getUsdcAddress(network)).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('throws for unsupported network', () => {
      // @ts-expect-error - testing invalid input
      expect(() => getUsdcAddress('invalid')).toThrow('Unsupported network');
    });
  });

  // Note: checkBalance tests require network calls
  // For unit tests, we test the utilities
  // Integration tests would hit real RPCs
});

import { describe, it, expect } from 'vitest';
import { getUsdcAddress } from '../src/balance';
import { USDC_ADDRESSES } from '../src/config';

describe('balance', () => {
  describe('getUsdcAddress', () => {
    it('should return correct address for base', () => {
      expect(getUsdcAddress('base')).toBe(USDC_ADDRESSES.base);
    });

    it('should return correct address for ethereum', () => {
      expect(getUsdcAddress('ethereum')).toBe(USDC_ADDRESSES.ethereum);
    });

    it('should return correct address for arbitrum', () => {
      expect(getUsdcAddress('arbitrum')).toBe(USDC_ADDRESSES.arbitrum);
    });

    it('should throw for unsupported network', () => {
      expect(() => getUsdcAddress('solana')).toThrow('Unsupported network: solana');
    });

    it('should throw for empty network', () => {
      expect(() => getUsdcAddress('')).toThrow('Unsupported network');
    });
  });

  // Note: checkBalance requires network calls
  // Integration tests would test actual balance checking
});

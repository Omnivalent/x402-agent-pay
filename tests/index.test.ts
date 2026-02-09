import { describe, it, expect } from 'vitest';
import * as x402AgentPay from '../src/index';

describe('x402-agent-pay exports', () => {
  describe('client exports', () => {
    it('exports AgentPayClient', () => {
      expect(x402AgentPay.AgentPayClient).toBeDefined();
      expect(typeof x402AgentPay.AgentPayClient).toBe('function');
    });

    it('exports createSimpleFetch', () => {
      expect(x402AgentPay.createSimpleFetch).toBeDefined();
      expect(typeof x402AgentPay.createSimpleFetch).toBe('function');
    });

    it('exports PaymentBlockedError', () => {
      expect(x402AgentPay.PaymentBlockedError).toBeDefined();
    });
  });

  describe('policy exports', () => {
    it('exports PolicyEnforcer', () => {
      expect(x402AgentPay.PolicyEnforcer).toBeDefined();
      expect(typeof x402AgentPay.PolicyEnforcer).toBe('function');
    });
  });

  describe('receipts exports', () => {
    it('exports ReceiptStore', () => {
      expect(x402AgentPay.ReceiptStore).toBeDefined();
      expect(typeof x402AgentPay.ReceiptStore).toBe('function');
    });
  });

  describe('config exports', () => {
    it('exports NETWORK_IDS', () => {
      expect(x402AgentPay.NETWORK_IDS).toBeDefined();
      expect(typeof x402AgentPay.NETWORK_IDS).toBe('object');
    });

    it('exports CHAINS', () => {
      expect(x402AgentPay.CHAINS).toBeDefined();
    });

    it('exports USDC_ADDRESSES', () => {
      expect(x402AgentPay.USDC_ADDRESSES).toBeDefined();
    });

    it('exports FACILITATOR_URL', () => {
      expect(x402AgentPay.FACILITATOR_URL).toBeDefined();
    });

    it('exports PROTOCOL_FEE_ADDRESS', () => {
      expect(x402AgentPay.PROTOCOL_FEE_ADDRESS).toBeDefined();
    });

    it('exports PROTOCOL_FEE_BPS', () => {
      expect(x402AgentPay.PROTOCOL_FEE_BPS).toBeDefined();
    });

    it('exports DEFAULT_POLICY', () => {
      expect(x402AgentPay.DEFAULT_POLICY).toBeDefined();
    });
  });

  describe('balance exports', () => {
    it('exports checkBalance', () => {
      expect(x402AgentPay.checkBalance).toBeDefined();
      expect(typeof x402AgentPay.checkBalance).toBe('function');
    });

    it('exports checkAllBalances', () => {
      expect(x402AgentPay.checkAllBalances).toBeDefined();
      expect(typeof x402AgentPay.checkAllBalances).toBe('function');
    });

    it('exports hasSufficientBalance', () => {
      expect(x402AgentPay.hasSufficientBalance).toBeDefined();
      expect(typeof x402AgentPay.hasSufficientBalance).toBe('function');
    });

    it('exports getUsdcAddress', () => {
      expect(x402AgentPay.getUsdcAddress).toBeDefined();
      expect(typeof x402AgentPay.getUsdcAddress).toBe('function');
    });
  });

  describe('discovery exports', () => {
    it('exports ServiceDiscovery', () => {
      expect(x402AgentPay.ServiceDiscovery).toBeDefined();
      expect(typeof x402AgentPay.ServiceDiscovery).toBe('function');
    });

    it('exports discoverServices', () => {
      expect(x402AgentPay.discoverServices).toBeDefined();
      expect(typeof x402AgentPay.discoverServices).toBe('function');
    });

    it('exports getDiscovery', () => {
      expect(x402AgentPay.getDiscovery).toBeDefined();
      expect(typeof x402AgentPay.getDiscovery).toBe('function');
    });
  });

  describe('facilitator exports', () => {
    it('exports createFacilitatorClient', () => {
      expect(x402AgentPay.createFacilitatorClient).toBeDefined();
      expect(typeof x402AgentPay.createFacilitatorClient).toBe('function');
    });

    it('exports DEFAULT_FACILITATOR_URL', () => {
      expect(x402AgentPay.DEFAULT_FACILITATOR_URL).toBeDefined();
      expect(typeof x402AgentPay.DEFAULT_FACILITATOR_URL).toBe('string');
    });

    it('exports verifyPayment', () => {
      expect(x402AgentPay.verifyPayment).toBeDefined();
      expect(typeof x402AgentPay.verifyPayment).toBe('function');
    });

    it('exports settlePayment', () => {
      expect(x402AgentPay.settlePayment).toBeDefined();
      expect(typeof x402AgentPay.settlePayment).toBe('function');
    });
  });
});

describe('config values', () => {
  it('NETWORK_IDS contains expected networks', () => {
    expect(x402AgentPay.NETWORK_IDS).toHaveProperty('base');
    expect(x402AgentPay.NETWORK_IDS).toHaveProperty('baseSepolia');
    expect(x402AgentPay.NETWORK_IDS).toHaveProperty('ethereum');
  });

  it('PROTOCOL_FEE_BPS is 50 (0.5%)', () => {
    expect(x402AgentPay.PROTOCOL_FEE_BPS).toBe(50);
  });

  it('DEFAULT_POLICY has reasonable defaults', () => {
    expect(x402AgentPay.DEFAULT_POLICY.maxPerTransaction).toBeGreaterThan(0);
    expect(x402AgentPay.DEFAULT_POLICY.dailyLimit).toBeGreaterThan(0);
  });
});

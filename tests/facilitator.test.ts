import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_FACILITATOR_URL, 
  createFacilitatorClient,
  FacilitatorConfig 
} from '../src/facilitator';

describe('Facilitator', () => {
  describe('DEFAULT_FACILITATOR_URL', () => {
    it('is defined', () => {
      expect(DEFAULT_FACILITATOR_URL).toBeDefined();
    });

    it('is a valid HTTPS URL', () => {
      expect(DEFAULT_FACILITATOR_URL.startsWith('https://')).toBe(true);
    });

    it('points to x402.org', () => {
      expect(DEFAULT_FACILITATOR_URL).toContain('x402.org');
    });
  });

  describe('createFacilitatorClient', () => {
    it('creates client with default config', () => {
      const client = createFacilitatorClient();
      expect(client).toBeDefined();
    });

    it('creates client with custom URL', () => {
      const client = createFacilitatorClient({ 
        url: 'https://custom-facilitator.example.com' 
      });
      expect(client).toBeDefined();
    });

    it('creates client with timeout config', () => {
      const client = createFacilitatorClient({ timeout: 5000 });
      expect(client).toBeDefined();
    });

    it('creates client with full config', () => {
      const config: FacilitatorConfig = {
        url: 'https://custom.example.com',
        timeout: 10000,
      };
      const client = createFacilitatorClient(config);
      expect(client).toBeDefined();
    });

    it('creates client with empty config', () => {
      const client = createFacilitatorClient({});
      expect(client).toBeDefined();
    });
  });
});

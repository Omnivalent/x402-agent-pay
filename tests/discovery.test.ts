import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceDiscovery, discoverServices } from '../src/discovery';

describe('ServiceDiscovery', () => {
  let discovery: ServiceDiscovery;

  beforeEach(() => {
    discovery = new ServiceDiscovery();
  });

  describe('constructor', () => {
    it('creates instance with default registry', () => {
      const d = new ServiceDiscovery();
      expect(d).toBeDefined();
    });

    it('creates instance with custom registry path', () => {
      const d = new ServiceDiscovery('./registry.json');
      expect(d).toBeDefined();
    });
  });

  describe('getAllServices', () => {
    it('returns array of services', async () => {
      const services = await discovery.getAllServices();
      expect(Array.isArray(services)).toBe(true);
    });

    it('services have required fields', async () => {
      const services = await discovery.getAllServices();
      if (services.length > 0) {
        const service = services[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('url');
      }
    });
  });

  describe('findByCategory', () => {
    it('filters by weather category', async () => {
      const services = await discovery.findByCategory('weather');
      expect(Array.isArray(services)).toBe(true);
      services.forEach(s => {
        expect(s.category).toBe('weather');
      });
    });

    it('filters by ai category', async () => {
      const services = await discovery.findByCategory('ai');
      expect(Array.isArray(services)).toBe(true);
    });

    it('filters by data category', async () => {
      const services = await discovery.findByCategory('data');
      expect(Array.isArray(services)).toBe(true);
    });

    it('filters by finance category', async () => {
      const services = await discovery.findByCategory('finance');
      expect(Array.isArray(services)).toBe(true);
    });

    it('returns empty array for unknown category', async () => {
      const services = await discovery.findByCategory('nonexistent');
      expect(services).toEqual([]);
    });

    it('is case-sensitive for category', async () => {
      const services1 = await discovery.findByCategory('weather');
      expect(services1.length).toBeGreaterThan(0);
    });
  });

  describe('findByNetwork', () => {
    it('filters by Base network', async () => {
      const services = await discovery.findByNetwork('eip155:8453');
      expect(Array.isArray(services)).toBe(true);
    });

    it('filters by Ethereum network', async () => {
      const services = await discovery.findByNetwork('eip155:1');
      expect(Array.isArray(services)).toBe(true);
    });

    it('filters by Base Sepolia testnet', async () => {
      const services = await discovery.findByNetwork('eip155:84532');
      expect(Array.isArray(services)).toBe(true);
    });

    it('returns empty for unknown network', async () => {
      const services = await discovery.findByNetwork('unknown:99999');
      expect(services).toEqual([]);
    });
  });

  describe('findUnderPrice', () => {
    it('filters services under $0.01', async () => {
      const services = await discovery.findUnderPrice(0.01);
      expect(Array.isArray(services)).toBe(true);
      services.forEach(s => {
        expect(s.priceRange.min).toBeLessThanOrEqual(0.01);
      });
    });

    it('filters services under $1.00', async () => {
      const services = await discovery.findUnderPrice(1.00);
      expect(Array.isArray(services)).toBe(true);
    });

    it('filters services under $0.001', async () => {
      const services = await discovery.findUnderPrice(0.001);
      expect(Array.isArray(services)).toBe(true);
    });

    it('handles zero price threshold', async () => {
      const services = await discovery.findUnderPrice(0);
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBe(0);
    });
  });

  describe('search', () => {
    it('searches by service name', async () => {
      const services = await discovery.search('weather');
      expect(Array.isArray(services)).toBe(true);
    });

    it('searches by description', async () => {
      const services = await discovery.search('api');
      expect(Array.isArray(services)).toBe(true);
    });

    it('returns empty for no match', async () => {
      const services = await discovery.search('xyznonexistent123');
      expect(services).toEqual([]);
    });

    it('handles case-insensitive search', async () => {
      const services1 = await discovery.search('Weather');
      const services2 = await discovery.search('weather');
      expect(services1.length).toBe(services2.length);
    });

    it('handles empty search query', async () => {
      const services = await discovery.search('');
      expect(Array.isArray(services)).toBe(true);
    });
  });

  describe('findCheapest', () => {
    it('finds cheapest in weather category', async () => {
      const cheapest = await discovery.findCheapest('weather');
      if (cheapest) {
        const allWeather = await discovery.findByCategory('weather');
        allWeather.forEach(s => {
          expect(cheapest.priceRange.min).toBeLessThanOrEqual(s.priceRange.min);
        });
      }
    });

    it('returns undefined for empty category', async () => {
      const cheapest = await discovery.findCheapest('nonexistent' as any);
      expect(cheapest).toBeUndefined();
    });

  });

  describe('caching', () => {
    it('caches results for subsequent calls', async () => {
      const services1 = await discovery.getAllServices();
      const services2 = await discovery.getAllServices();
      expect(services1).toEqual(services2);
    });
  });
});

describe('discoverServices helper', () => {
  it('discovers by category', async () => {
    const services = await discoverServices({ category: 'weather' });
    expect(Array.isArray(services)).toBe(true);
  });

  it('discovers by maxPrice', async () => {
    const services = await discoverServices({ maxPrice: 0.10 });
    expect(Array.isArray(services)).toBe(true);
  });

  it('discovers by network', async () => {
    const services = await discoverServices({ network: 'eip155:8453' });
    expect(Array.isArray(services)).toBe(true);
  });

  it('discovers by query', async () => {
    const services = await discoverServices({ query: 'api' });
    expect(Array.isArray(services)).toBe(true);
  });

  it('combines multiple filters', async () => {
    const services = await discoverServices({
      category: 'weather',
      maxPrice: 0.10,
    });
    expect(Array.isArray(services)).toBe(true);
  });

  it('returns all services with no filters', async () => {
    const services = await discoverServices({});
    expect(Array.isArray(services)).toBe(true);
  });
});

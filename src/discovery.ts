/**
 * x402 Service Discovery
 * Find and discover x402-enabled services programmatically
 * 
 * No competitor has this — agents can find paid APIs without hardcoding URLs
 */

export interface X402Service {
  /** Unique service ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Service description */
  description: string;
  /** Base URL for the service */
  url: string;
  /** Service category */
  category: ServiceCategory;
  /** Supported networks (CAIP-2 format) */
  networks: string[];
  /** Price range (min-max in USDC) */
  priceRange: { min: number; max: number };
  /** Endpoints offered */
  endpoints: X402Endpoint[];
  /** Service metadata */
  meta?: {
    provider?: string;
    docs?: string;
    rateLimit?: string;
    uptime?: number;
  };
}

export interface X402Endpoint {
  /** Endpoint path */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Price in USDC */
  price: number;
  /** Endpoint description */
  description: string;
}

export type ServiceCategory = 
  | 'weather'
  | 'data'
  | 'ai'
  | 'compute'
  | 'storage'
  | 'oracle'
  | 'search'
  | 'media'
  | 'finance'
  | 'other';

/** Default registry URL - can be self-hosted */
const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/Omnivalent/x402-agent-pay/master/registry.json';

/**
 * Service Discovery Client
 * Lets agents find x402-enabled services without hardcoding
 */
export class ServiceDiscovery {
  private registryUrl: string;
  private cache: X402Service[] | null = null;
  private cacheTime: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(registryUrl: string = DEFAULT_REGISTRY_URL) {
    this.registryUrl = registryUrl;
  }

  /**
   * Fetch all registered services
   */
  async getAllServices(): Promise<X402Service[]> {
    if (this.cache && Date.now() - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    try {
      const response = await fetch(this.registryUrl);
      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }
      const data = await response.json();
      this.cache = data.services || [];
      this.cacheTime = Date.now();
      return this.cache!;
    } catch (error) {
      console.warn('[x402] Registry fetch failed, using fallback:', error);
      return FALLBACK_SERVICES;
    }
  }

  /**
   * Find services by category
   */
  async findByCategory(category: ServiceCategory): Promise<X402Service[]> {
    const services = await this.getAllServices();
    return services.filter(s => s.category === category);
  }

  /**
   * Find services by network (e.g., 'eip155:8453' for Base)
   */
  async findByNetwork(network: string): Promise<X402Service[]> {
    const services = await this.getAllServices();
    return services.filter(s => s.networks.includes(network));
  }

  /**
   * Find services under a price threshold
   */
  async findUnderPrice(maxPrice: number): Promise<X402Service[]> {
    const services = await this.getAllServices();
    return services.filter(s => s.priceRange.min <= maxPrice);
  }

  /**
   * Search services by keyword
   */
  async search(query: string): Promise<X402Service[]> {
    const services = await this.getAllServices();
    const q = query.toLowerCase();
    return services.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.includes(q)
    );
  }

  /**
   * Get a specific service by ID
   */
  async getService(id: string): Promise<X402Service | undefined> {
    const services = await this.getAllServices();
    return services.find(s => s.id === id);
  }

  /**
   * Find the cheapest service in a category
   */
  async findCheapest(category: ServiceCategory): Promise<X402Service | undefined> {
    const services = await this.findByCategory(category);
    if (services.length === 0) return undefined;
    return services.reduce((cheapest, current) => 
      current.priceRange.min < cheapest.priceRange.min ? current : cheapest
    );
  }
}

/**
 * Fallback services when registry is unavailable
 * These are known x402-compatible services
 */
const FALLBACK_SERVICES: X402Service[] = [
  {
    id: 'x402-demo-weather',
    name: 'x402 Demo Weather API',
    description: 'Demo weather data endpoint for testing x402 payments',
    url: 'https://weather.x402.org',
    category: 'weather',
    networks: ['eip155:8453', 'eip155:84532'],
    priceRange: { min: 0.001, max: 0.01 },
    endpoints: [
      { path: '/forecast', method: 'GET', price: 0.001, description: 'Get weather forecast' },
    ],
    meta: {
      provider: 'x402.org',
      docs: 'https://x402.org/docs',
    },
  },
];

// Singleton for convenience
let defaultDiscovery: ServiceDiscovery | null = null;

/**
 * Get the default discovery client
 */
export function getDiscovery(): ServiceDiscovery {
  if (!defaultDiscovery) {
    defaultDiscovery = new ServiceDiscovery();
  }
  return defaultDiscovery;
}

/**
 * Quick helper to find services
 */
export async function discoverServices(options?: {
  category?: ServiceCategory;
  network?: string;
  maxPrice?: number;
  query?: string;
}): Promise<X402Service[]> {
  const discovery = getDiscovery();
  
  if (options?.query) {
    return discovery.search(options.query);
  }
  if (options?.category) {
    let services = await discovery.findByCategory(options.category);
    if (options?.network) {
      services = services.filter(s => s.networks.includes(options.network!));
    }
    if (options?.maxPrice !== undefined) {
      services = services.filter(s => s.priceRange.min <= options.maxPrice!);
    }
    return services;
  }
  if (options?.network) {
    return discovery.findByNetwork(options.network);
  }
  if (options?.maxPrice !== undefined) {
    return discovery.findUnderPrice(options.maxPrice);
  }
  
  return discovery.getAllServices();
}

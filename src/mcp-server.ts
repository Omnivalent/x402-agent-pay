#!/usr/bin/env node
/**
 * x402-agent-pay MCP Server
 * Model Context Protocol server for LLM agent integration
 * 
 * Works with Claude, GPT, and other MCP-compatible agents
 * 
 * Tools exposed:
 * - x402_pay: Make a payment to an x402-enabled endpoint
 * - x402_discover: Find x402 services by category/price/network
 * - x402_balance: Check USDC balance on a network
 * - x402_status: Get current spending status
 * - x402_history: Get recent payment history
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { AgentPayClient } from './client';
import { discoverServices, ServiceCategory } from './discovery';
import { checkBalance } from './balance';
import { NetworkName } from './config';

// Get wallet key from environment
const WALLET_KEY = process.env.X402_WALLET_KEY || process.env.WALLET_PRIVATE_KEY;

if (!WALLET_KEY) {
  console.error('Error: X402_WALLET_KEY or WALLET_PRIVATE_KEY environment variable required');
  process.exit(1);
}

// Initialize client
const client = new AgentPayClient({
  privateKey: WALLET_KEY,
  network: (process.env.X402_NETWORK as NetworkName) || 'base',
});

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'x402_pay',
    description: 'Make a payment to an x402-enabled API endpoint. Handles 402 Payment Required automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to make a paid request to',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'HTTP method (default: GET)',
        },
        body: {
          type: 'string',
          description: 'Request body for POST/PUT requests (JSON string)',
        },
        network: {
          type: 'string',
          enum: ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'baseSepolia'],
          description: 'Network for payment (default: base)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'x402_discover',
    description: 'Discover x402-enabled services. Find paid APIs by category, price, or network.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['weather', 'data', 'ai', 'compute', 'storage', 'oracle', 'search', 'media', 'finance', 'other'],
          description: 'Service category to search',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in USDC',
        },
        network: {
          type: 'string',
          description: 'Network filter (e.g., eip155:8453 for Base)',
        },
        query: {
          type: 'string',
          description: 'Search query for service name/description',
        },
      },
    },
  },
  {
    name: 'x402_balance',
    description: 'Check USDC balance for the configured wallet on a specific network.',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'baseSepolia'],
          description: 'Network to check balance on (default: base)',
        },
      },
    },
  },
  {
    name: 'x402_status',
    description: 'Get current spending status including daily/weekly/monthly totals and remaining limits.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'x402_history',
    description: 'Get recent payment history with receipts.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent payments to return (default: 10)',
        },
      },
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'x402-agent-pay',
    version: '2.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'x402_pay': {
        const { url, method = 'GET', body, network } = args as {
          url: string;
          method?: string;
          body?: string;
          network?: NetworkName;
        };

        const init: RequestInit = { method };
        if (body && (method === 'POST' || method === 'PUT')) {
          init.body = body;
          init.headers = { 'Content-Type': 'application/json' };
        }

        const response = await client.fetch(url, init, { network });
        const data = await response.text();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                data: tryParseJson(data),
              }, null, 2),
            },
          ],
        };
      }

      case 'x402_discover': {
        const { category, maxPrice, network, query } = args as {
          category?: ServiceCategory;
          maxPrice?: number;
          network?: string;
          query?: string;
        };

        const services = await discoverServices({ category, maxPrice, network, query });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: services.length,
                services: services.map(s => ({
                  name: s.name,
                  description: s.description,
                  url: s.url,
                  category: s.category,
                  priceRange: s.priceRange,
                  endpoints: s.endpoints,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'x402_balance': {
        const { network = 'base' } = args as { network?: NetworkName };
        const address = client.getAddress();
        const balance = await checkBalance(address, network);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                address,
                network,
                balanceUsdc: balance,
              }, null, 2),
            },
          ],
        };
      }

      case 'x402_status': {
        const status = client.getSpendingStatus();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'x402_history': {
        const { limit = 10 } = args as { limit?: number };
        const history = client.getHistory(limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: history.length,
                receipts: history,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message || String(error),
            name: error.name,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('x402-agent-pay MCP server running');
}

main().catch(console.error);

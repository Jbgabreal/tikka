# Token Price Service

The token price service provides a unified interface for retrieving the price of Solana tokens using multiple data sources. It's designed to be reliable by implementing a fallback mechanism.

## Features

- Token price lookups by mint address or symbol
- Multi-source price fetching (PumpPortal → Raydium)
- Robust error handling and fallback logic
- Pre-populated common token addresses
- Token metadata from Solana Token Registry

## Architecture

The token price service consists of several components:

1. **Token Mapping Service** - Maps token symbols to mint addresses
2. **PumpPortal Service** - Primary price data source
3. **Raydium Service** - Secondary (fallback) price data source
4. **Unified Token Price Service** - Coordinates between sources

## Usage

### Getting a Token Price by Mint Address

```typescript
import { getTokenPrice } from './services/tokenPrice.js';

try {
  // SOL mint address
  const mintAddress = 'So11111111111111111111111111111111111111112';
  const price = await getTokenPrice(mintAddress);
  console.log(`Price: $${price.toFixed(6)} USD`);
} catch (error) {
  console.error('Failed to get price:', error);
}
```

### Getting a Token Price by Symbol

```typescript
import { getTokenPriceBySymbol } from './services/tokenPrice.js';

try {
  const symbol = 'SOL';
  const price = await getTokenPriceBySymbol(symbol);
  console.log(`Price of ${symbol}: $${price.toFixed(6)} USD`);
} catch (error) {
  console.error('Failed to get price:', error);
}
```

## Interactive CLI Tool

For quick testing and demos, run the interactive token price checker:

```bash
npx tsx check-token-price.ts
```

This tool allows you to check token prices by entering either a symbol or mint address.

## Supported APIs

### PumpPortal API

The primary source for token price data. Requires an API key set in the environment variables.

Endpoint format: `https://pumpportal.fun/api/price/{TOKEN_MINT}?api-key={API_KEY}`

### Raydium API

Used as a fallback when PumpPortal doesn't have data for a particular token. No API key required.

Endpoint for price data: `https://api.raydium.io/v2/main/price`
Endpoint for token metadata: `https://api.raydium.io/v2/sdk/token/raydium.mainnet.json`

## Common Issues

- **404 Not Found**: The token is not available in the requested API
- **API Key issues**: Check that your PumpPortal API key is valid
- **Unknown symbol**: The token symbol is not in our mapping - consider adding it to the `KNOWN_TOKENS` map 
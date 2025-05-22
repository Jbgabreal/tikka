import axios from 'axios';

const RAYDIUM_API_URL = 'https://api.raydium.io/v2/main';
const RAYDIUM_TOKEN_LIST_URL = 'https://api.raydium.io/v2/sdk/token/raydium.mainnet.json';

// In-memory cache for prices to reduce API calls
let priceCache: { [mintAddress: string]: number } = {};
let lastPriceFetch: number = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds cache

// In-memory cache for token metadata
let symbolToMintMap: { [symbol: string]: string } = {};
let mintToSymbolMap: { [mint: string]: string } = {};
let mintToNameMap: { [mint: string]: string } = {};
let isInitialized = false;

// Pre-defined well-known tokens with their mint addresses
// These are essential tokens that we want to make sure are always available
const KNOWN_TOKENS: { [symbol: string]: string } = {
  'sol': 'So11111111111111111111111111111111111111112',
  'usdc': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'usdt': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'pyusd': '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  'eth': '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
  'btc': '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'wif': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'jup': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
};

/**
 * Initialize token metadata from Raydium and pre-populated list
 */
export async function initializeTokenMetadata(): Promise<void> {
  if (isInitialized) return;
  
  // First, add our known tokens to ensure critical tokens are always available
  for (const [symbol, mintAddress] of Object.entries(KNOWN_TOKENS)) {
    symbolToMintMap[symbol] = mintAddress;
    mintToSymbolMap[mintAddress] = symbol.toUpperCase();
    mintToNameMap[mintAddress] = symbol.toUpperCase(); // Default to symbol as name
  }
  
  try {
    const response = await axios.get(RAYDIUM_TOKEN_LIST_URL);
    
    // Raydium token list format has official, unOfficial, unNamed categories
    const data = response.data;
    const categories = ['official', 'unOfficial'];
    
    // Process tokens from each category
    for (const category of categories) {
      if (Array.isArray(data[category])) {
        data[category].forEach((token: any) => {
          if (token.symbol && token.mint) {
            const symbol = token.symbol.toLowerCase();
            const mint = token.mint;
            
            // Only add if we don't already have this symbol (known tokens take precedence)
            if (!symbolToMintMap[symbol]) {
              symbolToMintMap[symbol] = mint;
            }
            
            mintToSymbolMap[mint] = token.symbol;
            if (token.name) {
              mintToNameMap[mint] = token.name;
            }
          }
        });
      }
    }
    
    console.log(`Initialized Raydium token metadata with ${Object.keys(symbolToMintMap).length} tokens`);
  } catch (error) {
    console.error('Failed to initialize Raydium token metadata:', error);
    console.log('Using only pre-defined known tokens');
  }
  
  isInitialized = true;
}

/**
 * Refresh price cache from Raydium API
 */
async function refreshPriceCache(): Promise<void> {
  try {
    const response = await axios.get(`${RAYDIUM_API_URL}/price`);
    if (response.data && typeof response.data === 'object') {
      priceCache = response.data;
      lastPriceFetch = Date.now();
    }
  } catch (error) {
    console.error('Failed to refresh price cache from Raydium:', error);
    throw error;
  }
}

/**
 * Get token price by mint address
 * @param mintAddress The token mint address
 * @param fallbackSymbol Optional symbol to use if mint lookup fails
 * @returns The price in USD or null if not found
 */
export async function getTokenPriceByMint(mintAddress: string, fallbackSymbol?: string): Promise<number | null> {
  if (!mintAddress && !fallbackSymbol) return null;
  
  // Check if we need to refresh the price cache
  const now = Date.now();
  if (now - lastPriceFetch > CACHE_TTL || Object.keys(priceCache).length === 0) {
    await refreshPriceCache();
  }
  
  // Try mint address first
  if (mintAddress && priceCache[mintAddress] !== undefined) {
    return priceCache[mintAddress];
  }
  
  // Fallback to symbol if provided
  if (fallbackSymbol && priceCache[fallbackSymbol.toUpperCase()] !== undefined) {
    return priceCache[fallbackSymbol.toUpperCase()];
  }
  
  return null;
}

/**
 * Get token price from Raydium by symbol
 * @param tokenSymbol The token symbol (e.g., "BONK", "SOL")
 * @returns The price in USD or null if not found
 */
export async function getTokenPriceBySymbol(tokenSymbol: string): Promise<number | null> {
  if (!tokenSymbol) return null;
  
  // Ensure token metadata is initialized
  if (!isInitialized) {
    await initializeTokenMetadata();
  }
  
  // Look up mint address for this symbol
  const symbol = tokenSymbol.toLowerCase();
  const mintAddress = symbolToMintMap[symbol];
  
  if (!mintAddress) {
    return null;
  }
  
  // Get price by mint address
  return getTokenPriceByMint(mintAddress);
}

/**
 * Get mint address for a token symbol
 * @param symbol The token symbol (e.g., "BONK")
 * @returns The mint address or null if not found
 */
export function getMintAddressBySymbol(symbol: string): string | null {
  if (!symbol) return null;
  
  // Ensure initialization happened
  if (!isInitialized) {
    // Just use known tokens for now
    const lowerSymbol = symbol.toLowerCase();
    return KNOWN_TOKENS[lowerSymbol] || null;
  }
  
  return symbolToMintMap[symbol.toLowerCase()] || null;
}

/**
 * Get symbol for a mint address
 * @param mintAddress The token mint address
 * @returns The symbol or null if not found
 */
export function getSymbolByMintAddress(mintAddress: string): string | null {
  if (!mintAddress) return null;
  
  // Ensure initialization happened
  if (!isInitialized) {
    // Try to find in known tokens
    for (const [symbol, mint] of Object.entries(KNOWN_TOKENS)) {
      if (mint === mintAddress) {
        return symbol.toUpperCase();
      }
    }
    return null;
  }
  
  return mintToSymbolMap[mintAddress] || null;
}

/**
 * Get token name for a mint address
 * @param mintAddress The token mint address
 * @returns The token name or null if not found
 */
export function getTokenNameByMint(mintAddress: string): string | null {
  if (!mintAddress) return null;
  
  // Ensure initialization happened
  if (!isInitialized) {
    // Try to find in known tokens
    for (const [symbol, mint] of Object.entries(KNOWN_TOKENS)) {
      if (mint === mintAddress) {
        return symbol.toUpperCase();
      }
    }
    return null;
  }
  
  return mintToNameMap[mintAddress] || null;
}

// Initialize token metadata on module load
initializeTokenMetadata().catch(console.error); 
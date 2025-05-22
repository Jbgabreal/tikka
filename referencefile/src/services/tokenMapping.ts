import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';

// Pre-populated map of popular tokens as a fallback
const popularTokens: { [key: string]: string } = {
  'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'wif': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'jup': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'ray': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'jto': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'pyth': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'tnsr': 'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6',
  'honey': 'HonyeYAaTPgKUg4payCIssT6ZQRed5PkeaP8KziXokW',
  'mnde': 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',
  'myro': 'myroWeHQVGuTLCgD4macapPsCxonNn72ST8KCLZ4wub',
  'sol': 'So11111111111111111111111111111111111111112' // Native SOL wrapped token
};

// In-memory cache for token map
let tokenMap = new Map<string, TokenInfo>();
let isInitialized = false;

/**
 * Initialize the token map by fetching from Solana Token List
 */
export async function initializeTokenMap(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const tokens = await new TokenListProvider().resolve();
    const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
    
    tokenList.forEach(token => {
      tokenMap.set(token.symbol.toLowerCase(), token);
    });
    
    isInitialized = true;
    console.log(`Initialized token map with ${tokenMap.size} tokens`);
  } catch (error) {
    console.error('Failed to initialize token map:', error);
    // Still mark as initialized to prevent constant retries
    isInitialized = true;
  }
}

/**
 * Get token mint address from symbol
 * @param symbol Token symbol (e.g., "BONK", "$BONK", "bonk")
 * @returns The mint address or null if not found
 */
export function getTokenAddress(symbol: string): string | null {
  if (!symbol) return null;
  // Clean the symbol (remove $, convert to lowercase)
  const cleanSymbol = symbol.toLowerCase().replace(/^[\$]/, '');

  // 1. Check our pre-populated fallback map FIRST
  if (popularTokens[cleanSymbol]) {
    console.log(`DEBUG: symbol '${symbol}' maps to mint '${popularTokens[cleanSymbol]}' (from popularTokens)`);
    return popularTokens[cleanSymbol];
  }

  // 2. Then check the in-memory token map (registry)
  const tokenInfo = tokenMap.get(cleanSymbol);
  if (tokenInfo) {
    console.log(`DEBUG: symbol '${symbol}' maps to mint '${tokenInfo.address}' (from token registry)`);
    return tokenInfo.address;
  }

  console.log(`DEBUG: symbol '${symbol}' not found in mapping.`);
  return null;
}

/**
 * Extract token symbol from a message
 * This function looks for token symbols in various formats:
 * - "$BONK" or "BONK"
 * - "price of BONK" or "BONK price"
 * - Other common token request patterns
 */
export function extractTokenSymbol(message: string): string | null {
  // Remove case sensitivity
  const lowerMessage = message.toLowerCase();
  
  // Check for common price query patterns
  const pricePatterns = [
    /price of [$]?([a-z0-9]+)/i,          // "price of BONK" or "price of $BONK"
    /[$]?([a-z0-9]+) price/i,              // "BONK price" or "$BONK price"
    /how much is [$]?([a-z0-9]+)/i,        // "how much is BONK" or "how much is $BONK"
    /what is [$]?([a-z0-9]+) worth/i,      // "what is BONK worth" or "what is $BONK worth"
    /[$]([a-z0-9]+)/                       // "$BONK"
  ];
  
  for (const pattern of pricePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Check for standalone ticker symbols (3-5 characters, all caps)
  const tickerMatch = message.match(/\b([A-Z0-9]{3,5})\b/);
  if (tickerMatch) {
    return tickerMatch[1];
  }
  
  return null;
}

// Initialize token map on module load
initializeTokenMap().catch(console.error); 
import { getTokenPrice as getPumpPortalTokenPrice } from './pumpportal.js';
import { getTokenPriceByMint as getRaydiumTokenPrice, getTokenPriceBySymbol as getRaydiumTokenPriceBySymbol } from './raydium.js';
import { getDexScreenerPrice } from './dexscreener.js';
import { getTokenAddress } from './tokenMapping.js';
import { cacheTokenPrice, getCachedTokenPrice as getRedisCachedTokenPrice } from '../redis/index.js';
import { query } from '../database/index.js';
import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_PRICE_URL = 'https://api.helius.xyz/v0/token-price';

/**
 * Get token price from multiple sources (PumpPortal, Raydium, DexScreener)
 * @param mintAddress The token mint address
 * @returns The price in USD
 * @throws Error if price cannot be retrieved from any source
 */
export async function getTokenPrice(mintAddress: string): Promise<number> {
  try {
    // First try PumpPortal
    const pumpPortalPrice = await getPumpPortalTokenPrice(mintAddress);
    return pumpPortalPrice;
  } catch (error: any) {
    console.warn(`PumpPortal price fetch failed for ${mintAddress}, trying Raydium...`, error.message);
    try {
      // Raydium
      const raydiumPrice = await getRaydiumTokenPrice(mintAddress);
      if (raydiumPrice !== null) return raydiumPrice;
      throw new Error('No price available from Raydium');
    } catch (raydiumError: any) {
      console.warn(`Raydium price fetch failed for ${mintAddress}, trying DexScreener...`, raydiumError.message);
      // DexScreener fallback
      const dexScreenerPrice = await getDexScreenerPrice(mintAddress);
      if (dexScreenerPrice !== null) return dexScreenerPrice;
      throw new Error(`Failed to get token price from any source: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Get token price by symbol from multiple sources
 * @param symbol The token symbol (e.g., "BONK", "SOL")
 * @returns The price in USD
 * @throws Error if price cannot be retrieved from any source
 */
export async function getTokenPriceBySymbol(symbol: string): Promise<number> {
  const mintAddress = getTokenAddress(symbol);
  if (!mintAddress) throw new Error(`No mint address found for symbol ${symbol}`);
  try {
    const pumpPortalPrice = await getPumpPortalTokenPrice(mintAddress);
    return pumpPortalPrice;
  } catch (error: any) {
    console.warn(`PumpPortal price fetch failed for ${symbol} (mint: ${mintAddress}), trying Raydium with symbol...`, error.message);
    try {
      const raydiumPrice = await getRaydiumTokenPrice(mintAddress, symbol);
      if (raydiumPrice !== null) return raydiumPrice;
      throw new Error('No price available from Raydium');
    } catch (raydiumError: any) {
      console.warn(`Raydium price fetch failed for ${symbol}, trying DexScreener...`, raydiumError.message);
      // DexScreener fallback
      const dexScreenerPrice = await getDexScreenerPrice(mintAddress);
      if (dexScreenerPrice !== null) return dexScreenerPrice;
      throw new Error(`Failed to get token price for ${symbol} from any source: ${error.message || 'Unknown error'}`);
    }
  }
}

// Helper to fetch price from Helius
async function getHeliusPrice(mint: string): Promise<number | null> {
  if (!HELIUS_API_KEY) return null;
  try {
    const res = await axios.post(
      `${HELIUS_PRICE_URL}?api-key=${HELIUS_API_KEY}`,
      { mintAccounts: [mint] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data && Array.isArray(res.data) && res.data[0]?.price) {
      return Number(res.data[0].price);
    }
    return null;
  } catch (e) {
    console.error('Helius price fetch failed for', mint, e);
    return null;
  }
}

// Patch getCachedTokenPrice to fallback to Helius
export async function getCachedTokenPrice(mint: string): Promise<number | null> {
  // Try existing sources first (PumpPortal, Raydium, etc.)
  try {
    // Try Redis cache first
    const cached = await getRedisCachedTokenPrice(mint);
    if (cached !== null) return cached;
    const price = await getTokenPrice(mint);
    await cacheTokenPrice(mint, price, 1200); // 20 min
    return price;
  } catch (e) {
    // Fallback to Helius
    const heliusPrice = await getHeliusPrice(mint);
    if (heliusPrice !== null) return heliusPrice;
    return null;
  }
}

export async function getCachedTokenPriceBySymbol(symbol: string): Promise<number> {
  const cacheKey = `symbol:${symbol.toUpperCase()}`;
  const cached = await getRedisCachedTokenPrice(cacheKey);
  if (cached !== null) return cached;
  const price = await getTokenPriceBySymbol(symbol);
  await cacheTokenPrice(cacheKey, price, 1200); // 20 min
  return price;
}

// Cache for historical prices
const historicalPriceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Store token price in the database
 */
export async function storeTokenPrice(mintAddress: string, price: number, source: string = 'aggregate'): Promise<void> {
  try {
    await query(
      'INSERT INTO token_prices (mint_address, price, source) VALUES ($1, $2, $3)',
      [mintAddress, price, source]
    );
  } catch (error) {
    console.error('Error storing token price:', error);
  }
}

// Patch getHistoricalPrice logic
export async function getHistoricalPrice(mint: string, timeFrameInSeconds: number): Promise<number | null> {
  const { rows } = await query(
    `SELECT price FROM token_prices 
     WHERE mint_address = $1 
     AND timestamp <= NOW() - INTERVAL '${timeFrameInSeconds} seconds'
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [mint]
  );
  if (rows.length > 0) {
    return Number(rows[0].price);
  } else {
    // No historical price, insert current price as first entry
    const currentPrice = await getCachedTokenPrice(mint);
    if (currentPrice !== null) {
      await storeTokenPrice(mint, currentPrice, 'fallback');
      return null; // Indicate no historical price, so percent change will be 0
    }
    return null;
  }
}

// Patch getPriceChangePercent to handle missing historical price
export async function getPriceChangePercent(mintAddress: string, timeFrame: '1h' | '24h' | '7d' | '30d'): Promise<{
  currentPrice: number;
  historicalPrice: number | null;
  changePercent: number;
}> {
  const currentPrice = await getCachedTokenPrice(mintAddress);
  if (!currentPrice) {
    throw new Error('Failed to get current price');
  }
  // Convert time frame to seconds
  const timeFrameInSeconds = {
    '1h': 3600,
    '24h': 86400,
    '7d': 604800,
    '30d': 2592000
  }[timeFrame];
  const historicalPrice = await getHistoricalPrice(mintAddress, timeFrameInSeconds);
  let changePercent = 0;
  if (historicalPrice && historicalPrice > 0) {
    changePercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
  } else {
    // No historical price, treat as 0% change
    changePercent = 0;
  }
  return {
    currentPrice,
    historicalPrice,
    changePercent
  };
}

/**
 * Get top trending tokens based on price change percentage
 */
export async function getTopTrendingTokens(limit: number = 10, timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<Array<{
  mint: string;
  symbol: string;
  name: string;
  currentPrice: number;
  historicalPrice: number;
  changePercent: number;
  volume24h?: number;
  logoURI?: string;
}>> {
  try {
    // Get all tokens from the database
    const result = await query('SELECT mint_address, symbol, name, logo_uri FROM token_metadata');
    const tokens = result.rows;

    // Get price changes for all tokens
    const tokensWithPriceChanges = await Promise.all(
      tokens.map(async (token) => {
        try {
          const priceChange = await getPriceChangePercent(token.mint_address, timeFrame);
          return {
            mint: token.mint_address,
            symbol: token.symbol,
            name: token.name,
            logoURI: token.logo_uri,
            ...priceChange
          };
        } catch (error) {
          console.error(`Error getting price change for ${token.symbol}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by change percentage
    return tokensWithPriceChanges
      .filter((token): token is NonNullable<typeof token> => token !== null)
      .map(token => ({
        ...token,
        historicalPrice: token.historicalPrice ?? 0
      }))
      .sort((a: NonNullable<typeof tokensWithPriceChanges[0]>, b: NonNullable<typeof tokensWithPriceChanges[0]>) => b.changePercent - a.changePercent)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top trending tokens:', error);
    throw error;
  }
}

/**
 * Get top trending tokens using address from token_metadata and mint_address from token_prices
 */
export async function getTrendingTokensByAddress(limit: number = 10, timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<Array<{
  address: string;
  symbol: string;
  name: string;
  currentPrice: number;
  historicalPrice: number;
  changePercent: number;
  volume24h?: number;
  logoURI?: string;
}>> {
  try {
    // Get all tokens from the database using address
    const result = await query('SELECT address, symbol, name, logo_uri FROM token_metadata');
    const tokens = result.rows;

    // Get price changes for all tokens
    const tokensWithPriceChanges = await Promise.all(
      tokens.map(async (token) => {
        try {
          // Use address as mint_address for price table
          const priceChange = await getPriceChangePercent(token.address, timeFrame);
          return {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            logoURI: token.logo_uri,
            ...priceChange
          };
        } catch (error) {
          console.error(`Error getting price change for ${token.symbol}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by change percentage
    return tokensWithPriceChanges
      .filter((token): token is NonNullable<typeof token> => token !== null)
      .map(token => ({
        ...token,
        historicalPrice: token.historicalPrice ?? 0
      }))
      .sort((a: NonNullable<typeof tokensWithPriceChanges[0]>, b: NonNullable<typeof tokensWithPriceChanges[0]>) => b.changePercent - a.changePercent)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending tokens by address:', error);
    throw error;
  }
}

const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
const MORALIS_TRENDING_URL = 'https://deep-index.moralis.io/api/v2.2/tokens/trending?chain=solana';

/**
 * Fetch trending tokens from Moralis, compare with DB, and return top N with percentage change
 */
export async function getMoralisTrendingWithDbComparison(limit: number = 10, timeFrame: '1h' | '24h' | '7d' | '30d' = '24h') {
  try {
    // 1. Fetch trending tokens from Moralis
    const moralisRes = await axios.get(MORALIS_TRENDING_URL, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    const trending = moralisRes.data.result || moralisRes.data || [];
    if (!Array.isArray(trending)) return [];

    // 2. For each token, check if it exists in local DB and get price change
    const results = await Promise.all(trending.slice(0, limit * 2).map(async (token: any) => {
      // Moralis uses tokenAddress for mint
      const mint = token.tokenAddress || token.address;
      // Check if token exists in local DB
      let metaRes = await query('SELECT symbol, name, logo_uri FROM token_metadata WHERE address = $1', [mint]);
      if (!metaRes.rows.length) {
        // Insert token into token_metadata if not found, include decimals
        await query(
          'INSERT INTO token_metadata (address, symbol, name, decimals, logo_uri) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (address) DO NOTHING',
          [mint, token.symbol, token.name, token.decimals ?? 0, token.logo]
        );
        // Re-query to get the inserted row
        metaRes = await query('SELECT symbol, name, logo_uri FROM token_metadata WHERE address = $1', [mint]);
      }
      if (!metaRes.rows.length) return null;
      const meta = metaRes.rows[0];
      // Get current price (prefer Moralis, fallback to DB)
      const currentPrice = token.usdPrice || (await getCachedTokenPrice(mint).catch(() => null));
      if (!currentPrice) return null;
      // Get historical price from DB
      let timeFrameInSeconds = { '1h': 3600, '24h': 86400, '7d': 604800, '30d': 2592000 }[timeFrame];
      const historicalPrice = await getHistoricalPrice(mint, timeFrameInSeconds);
      if (!historicalPrice) return null;
      const changePercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
      return {
        symbol: meta.symbol,
        name: meta.name,
        mint,
        price: currentPrice,
        priceChange: currentPrice - historicalPrice,
        priceChangePercent: changePercent,
        logoURI: meta.logo_uri
      };
    }));
    // 3. Filter, sort, and limit
    return results.filter(Boolean).sort((a, b) => (b?.priceChangePercent ?? 0) - (a?.priceChangePercent ?? 0)).slice(0, limit);
  } catch (err) {
    console.error('Error fetching Moralis trending tokens:', err);
    return [];
  }
} 
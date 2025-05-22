import { setCache, getCache } from '../redis/index.js';

const CACHE_TTL = 300; // 5 minutes

interface TrendingToken {
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

export async function getTrendingTokens(timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<TrendingToken[]> {
  // Try to get from cache first
  const cached = await getCache(`trending:${timeFrame}`);
  if (cached) {
    return cached;
  }

  try {
    // Here you would implement the actual trending tokens logic
    // For now, we'll return some mock data
    const trendingTokens: TrendingToken[] = [
      {
        symbol: 'SOL',
        price: 100.50,
        priceChange24h: 5.2,
        volume24h: 1000000,
        marketCap: 5000000000
      },
      {
        symbol: 'BONK',
        price: 0.00000123,
        priceChange24h: 12.5,
        volume24h: 500000,
        marketCap: 100000000
      },
      {
        symbol: 'RAY',
        price: 0.45,
        priceChange24h: -2.1,
        volume24h: 300000,
        marketCap: 200000000
      }
    ];

    // Cache the results
    await setCache(`trending:${timeFrame}`, trendingTokens, CACHE_TTL);

    return trendingTokens;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
}

export async function getTokenPriceChange(
  symbol: string,
  timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<number> {
  try {
    // Here you would implement the actual price change logic
    // For now, we'll return a mock value
    return 5.2;
  } catch (error) {
    console.error(`Error fetching price change for ${symbol}:`, error);
    throw error;
  }
}

export async function getTokenVolume(
  symbol: string,
  timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<number> {
  try {
    // Here you would implement the actual volume logic
    // For now, we'll return a mock value
    return 1000000;
  } catch (error) {
    console.error(`Error fetching volume for ${symbol}:`, error);
    throw error;
  }
} 
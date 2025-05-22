import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import { getTopTrendingTokens } from './tokenPrice.js';
import { TokenCreationSession } from '../types/chat.js';
import { setCache, getCache } from '../redis/index.js';

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

// Cache for token prices
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL = 3600; // 1 hour

/**
 * Get token price from multiple DEXs
 * @param symbol Token symbol
 * @returns Token price in USD
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    // Fetch prices from multiple sources
    const [dexscreenerPrice, raydiumPrice, orcaPrice] = await Promise.all([
      getDexscreenerPrice(symbol),
      getRaydiumPrice(symbol),
      getOrcaPrice(symbol)
    ]);

    // Calculate average price
    const prices = [dexscreenerPrice, raydiumPrice, orcaPrice].filter(price => price !== null);
    const averagePrice = prices.reduce((sum, price) => sum + price!, 0) / prices.length;

    // Update cache
    priceCache.set(symbol, { price: averagePrice, timestamp: Date.now() });

    return averagePrice;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw new Error('Failed to fetch token price');
  }
}

/**
 * Get gas estimate for transaction type
 * @param txType Transaction type (swap or bridge)
 * @returns Estimated gas cost in lamports
 */
export async function getGasEstimate(txType: 'swap' | 'bridge'): Promise<number> {
  try {
    const recentBlockhash = await connection.getRecentBlockhash();
    const baseFee = recentBlockhash.feeCalculator.lamportsPerSignature;

    // Add additional costs based on transaction type
    const additionalCost = txType === 'swap' ? 5000 : 10000; // Example values
    return baseFee + additionalCost;
  } catch (error) {
    console.error('Error getting gas estimate:', error);
    throw new Error('Failed to get gas estimate');
  }
}

// Helper functions for price fetching
async function getDexscreenerPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${symbol}`);
    return response.data.pairs[0]?.priceUsd || null;
  } catch {
    return null;
  }
}

async function getRaydiumPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(`https://api.raydium.io/v2/main/price?symbol=${symbol}`);
    return response.data.price || null;
  } catch {
    return null;
  }
}

async function getOrcaPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(`https://api.orca.so/pools`);
    const pool = response.data.find((p: any) => p.tokenSymbol === symbol);
    return pool?.price || null;
  } catch {
    return null;
  }
}

/**
 * Get trending tokens with time-based filters
 * @param timeFrame Time frame for trending data ('1h', '24h', '7d', '30d')
 * @returns Array of trending tokens with price changes
 */
export async function getTrendingTokens(timeFrame: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<Array<{
  symbol: string;
  name: string;
  mint: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume24h?: number;
  logoURI?: string;
}>> {
  try {
    // Get top trending tokens using our new system
    const trendingTokens = await getTopTrendingTokens(10, timeFrame);
    
    // Map to the expected format
    return trendingTokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
      mint: token.mint,
      price: token.currentPrice,
      priceChange: token.currentPrice - token.historicalPrice,
      priceChangePercent: token.changePercent,
      volume24h: token.volume24h,
      logoURI: token.logoURI
    }));
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
}

export async function getTokenCreationSession(userId: string): Promise<TokenCreationSession | null> {
  return await getCache(`token_creation:${userId}`);
}

export async function clearTokenCreationSession(userId: string): Promise<void> {
  await setCache(`token_creation:${userId}`, null, CACHE_TTL);
}

export async function saveTokenCreationSession(userId: string, session: TokenCreationSession): Promise<void> {
  await setCache(`token_creation:${userId}`, session, CACHE_TTL);
}

export async function handleTokenCreationStep(
  session: TokenCreationSession,
  input: string,
  userId: string
): Promise<{ response: string; step?: string; unsignedTransaction?: string }> {
  const { step } = session;

  switch (step) {
    case 'name':
      session.name = input;
      session.step = 'symbol';
      await saveTokenCreationSession(userId, session);
      return {
        response: 'Great! What symbol would you like to use for your token? (e.g., BTC, ETH)',
        step: 'symbol'
      };

    case 'symbol':
      if (!/^[A-Z0-9]{2,10}$/.test(input)) {
        return {
          response: 'Please provide a valid symbol (2-10 characters, uppercase letters and numbers only).',
          step: 'symbol'
        };
      }
      session.symbol = input;
      session.step = 'supply';
      await saveTokenCreationSession(userId, session);
      return {
        response: 'How many tokens would you like to create? (Enter a number)',
        step: 'supply'
      };

    case 'supply':
      const supply = parseInt(input);
      if (isNaN(supply) || supply <= 0) {
        return {
          response: 'Please provide a valid number for the token supply.',
          step: 'supply'
        };
      }
      session.supply = supply;
      session.step = 'description';
      await saveTokenCreationSession(userId, session);
      return {
        response: 'Please provide a brief description of your token.',
        step: 'description'
      };

    case 'description':
      session.description = input;
      session.step = 'social';
      await saveTokenCreationSession(userId, session);
      return {
        response: 'Would you like to add any social media links? (Twitter, Telegram, Website)',
        step: 'social'
      };

    case 'social':
      // Parse social links
      const twitterMatch = input.match(/twitter:?\s*([^\s]+)/i);
      const telegramMatch = input.match(/telegram:?\s*([^\s]+)/i);
      const websiteMatch = input.match(/website:?\s*([^\s]+)/i);

      session.socialLinks = {
        twitter: twitterMatch ? twitterMatch[1] : undefined,
        telegram: telegramMatch ? telegramMatch[1] : undefined,
        website: websiteMatch ? websiteMatch[1] : undefined
      };

      session.step = 'confirm';
      await saveTokenCreationSession(userId, session);

      const summary = `
Token Creation Summary:
Name: ${session.name}
Symbol: ${session.symbol}
Supply: ${session.supply}
Description: ${session.description}
Social Links:
${session.socialLinks?.twitter ? `Twitter: ${session.socialLinks.twitter}` : ''}
${session.socialLinks?.telegram ? `Telegram: ${session.socialLinks.telegram}` : ''}
${session.socialLinks?.website ? `Website: ${session.socialLinks.website}` : ''}

Type 'confirm' to create your token or 'cancel' to start over.`;

      return {
        response: summary,
        step: 'confirm'
      };

    case 'confirm':
      if (input.toLowerCase() === 'confirm') {
        try {
          // Here you would implement the actual token creation logic
          // For now, we'll just return a success message
          await clearTokenCreationSession(userId);
          return {
            response: 'Token creation initiated! You will need to sign a transaction to complete the process.',
            unsignedTransaction: 'YOUR_UNSIGNED_TRANSACTION_HERE' // Replace with actual transaction
          };
        } catch (error) {
          console.error('Error creating token:', error);
          return {
            response: 'Failed to create token. Please try again.',
            step: 'confirm'
          };
        }
      } else if (input.toLowerCase() === 'cancel') {
        await clearTokenCreationSession(userId);
        return {
          response: 'Token creation cancelled. You can start over by typing "create token".'
        };
      } else {
        return {
          response: 'Please type "confirm" to create your token or "cancel" to start over.',
          step: 'confirm'
        };
      }

    default:
      return {
        response: 'Something went wrong. Please start over by typing "create token".'
      };
  }
} 
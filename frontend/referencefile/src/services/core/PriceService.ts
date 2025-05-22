import { getTokenPrice as getPumpPortalTokenPrice } from '../pumpportal.js';
import { getTokenPriceByMint as getRaydiumTokenPrice, getTokenPriceBySymbol as getRaydiumTokenPriceBySymbol } from '../raydium.js';
import { getDexScreenerPrice } from '../dexscreener.js';
import { getTokenAddress } from '../tokenMapping.js';
import { cacheTokenPrice, getCachedTokenPrice } from '../../redis/index.js';
import { query } from '../../database/index.js';
import { ChatContext } from '../../types/chat.js';
import { setCache, getCache } from '../../redis/index.js';

export class PriceService {
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Handle price query from chat
   */
  async handlePriceQuery(message: string, context: ChatContext): Promise<string> {
    const symbol = this.extractTokenSymbol(message);
    if (!symbol) {
      return "I couldn't identify which token you're asking about. Please specify a token symbol or address.";
    }

    try {
      const price = await this.getTokenPrice(symbol);
      return `The current price of ${symbol.toUpperCase()} is $${price.toFixed(6)} USD`;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return `Sorry, I couldn't fetch the price for ${symbol.toUpperCase()}. Please try again later.`;
    }
  }

  /**
   * Get token price from multiple sources with fallback
   */
  async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Try to get from cache first
      const cachedPrice = await this.getCachedPrice(symbol);
      if (cachedPrice !== null) {
        return cachedPrice;
      }

      // Get mint address for symbol
      const mintAddress = getTokenAddress(symbol);
      if (!mintAddress) {
        throw new Error(`No mint address found for symbol ${symbol}`);
      }

      // Try multiple price sources
      const price = await this.getPriceFromMultipleSources(mintAddress, symbol);
      
      // Cache the result
      await this.cachePrice(symbol, price);
      
      return price;
    } catch (error) {
      console.error('Error getting token price:', error);
      throw error;
    }
  }

  /**
   * Get token price by mint address
   */
  async getTokenPriceByMint(mintAddress: string): Promise<number> {
    try {
      // Try to get from cache first
      const cachedPrice = await this.getCachedPrice(mintAddress);
      if (cachedPrice !== null) {
        return cachedPrice;
      }

      // Try multiple price sources
      const price = await this.getPriceFromMultipleSources(mintAddress);
      
      // Cache the result
      await this.cachePrice(mintAddress, price);
      
      return price;
    } catch (error) {
      console.error('Error getting token price by mint:', error);
      throw error;
    }
  }

  /**
   * Get price from multiple sources with fallback
   */
  private async getPriceFromMultipleSources(mintAddress: string, symbol?: string): Promise<number> {
    try {
      // Try PumpPortal first
      const pumpPortalPrice = await this.getPumpPortalPrice(mintAddress);
      if (pumpPortalPrice !== null) {
        return pumpPortalPrice;
      }

      // Try Raydium
      const raydiumPrice = symbol 
        ? await getRaydiumTokenPriceBySymbol(symbol)
        : await getRaydiumTokenPrice(mintAddress);
      
      if (raydiumPrice !== null) return raydiumPrice;
      throw new Error('No price available from Raydium');
    } catch (error) {
      console.warn(`Raydium price fetch failed for ${mintAddress}, trying DexScreener...`, error);
      // Try DexScreener as last resort
      const dexScreenerPrice = await this.getDexScreenerPrice(mintAddress, symbol);
      if (dexScreenerPrice !== null) return dexScreenerPrice;
      throw new Error('Failed to get token price from any source');
    }
  }

  /**
   * Get price from PumpPortal
   */
  private async getPumpPortalPrice(mintAddress: string): Promise<number | null> {
    try {
      const response = await fetch(`https://pumpportal.fun/api/token/${mintAddress}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return parseFloat(data.price || '0');
    } catch (error) {
      console.error('Error fetching PumpPortal price:', error);
      return null;
    }
  }

  /**
   * Get price from DexScreener
   */
  private async getDexScreenerPrice(mintAddress: string, symbol?: string): Promise<number | null> {
    try {
      const query = symbol || mintAddress;
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${query}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data.pairs || !data.pairs.length) return null;
      
      // Get the first pair's price
      return parseFloat(data.pairs[0].priceUsd || '0');
    } catch (error) {
      console.error('Error fetching DexScreener price:', error);
      return null;
    }
  }

  /**
   * Cache price
   */
  private async cachePrice(key: string, price: number): Promise<void> {
    await setCache(`token:price:${key}`, price, this.CACHE_TTL);
  }

  /**
   * Get cached price
   */
  private async getCachedPrice(key: string): Promise<number | null> {
    return await getCache<number>(`token:price:${key}`);
  }

  /**
   * Extract token symbol from message
   */
  private extractTokenSymbol(message: string): string | null {
    const patterns = [
      /price of (\w+)/i,
      /(\w+) price/i,
      /how much is (\w+)/i,
      /what's the price of (\w+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Store historical price in database
   */
  async storeHistoricalPrice(mintAddress: string, price: number, source: string = 'aggregate'): Promise<void> {
    try {
      await query(
        'INSERT INTO token_prices (mint_address, price, source) VALUES ($1, $2, $3)',
        [mintAddress, price, source]
      );
    } catch (error) {
      console.error('Error storing historical price:', error);
    }
  }

  /**
   * Get historical price from database
   */
  async getHistoricalPrice(mintAddress: string, timeFrameInSeconds: number): Promise<number | null> {
    try {
      const result = await query(
        'SELECT price FROM token_prices WHERE mint_address = $1 AND created_at >= NOW() - INTERVAL \'1 second\' * $2 ORDER BY created_at DESC LIMIT 1',
        [mintAddress, timeFrameInSeconds]
      );
      return result.rows[0]?.price || null;
    } catch (error) {
      console.error('Error getting historical price:', error);
      return null;
    }
  }
} 
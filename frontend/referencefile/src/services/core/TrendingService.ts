import { ChatContext } from '../../types/chat.js';
import { setCache, getCache } from '../../redis/index.js';

interface TrendingToken {
  symbol: string;
  mint: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
}

export class TrendingService {
  private readonly CACHE_KEY = 'trending_tokens';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Handle trending token query
   */
  async handleTrendingQuery(message: string, context: ChatContext): Promise<string> {
    try {
      const tokens = await this.getTrendingTokens();
      return this.formatTrendingResponse(tokens);
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return 'Sorry, I encountered an error while fetching trending tokens. Please try again later.';
    }
  }

  /**
   * Get trending tokens from cache or fetch new data
   */
  private async getTrendingTokens(): Promise<TrendingToken[]> {
    // Try to get from cache first
    const cached = await getCache<TrendingToken[]>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Fetch new data
    const tokens = await this.fetchTrendingTokens();
    
    // Cache the results
    await setCache(this.CACHE_KEY, tokens, this.CACHE_TTL);
    
    return tokens;
  }

  /**
   * Fetch trending tokens from multiple sources
   */
  private async fetchTrendingTokens(): Promise<TrendingToken[]> {
    const tokens: TrendingToken[] = [];

    try {
      // Fetch from DexScreener
      const dexScreenerResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/trending');
      if (dexScreenerResponse.ok) {
        const data = await dexScreenerResponse.json();
        if (data.pairs) {
          data.pairs.forEach((pair: any) => {
            if (pair.baseToken && pair.baseToken.address) {
              tokens.push({
                symbol: pair.baseToken.symbol,
                mint: pair.baseToken.address,
                price: parseFloat(pair.priceUsd || '0'),
                volume24h: parseFloat(pair.volume24h || '0'),
                priceChange24h: parseFloat(pair.priceChange24h || '0'),
                marketCap: parseFloat(pair.marketCap || '0')
              });
            }
          });
        }
      }

      // Fetch from Raydium
      const raydiumResponse = await fetch('https://api.raydium.io/v2/main/trending');
      if (raydiumResponse.ok) {
        const data = await raydiumResponse.json();
        if (data.data) {
          data.data.forEach((token: any) => {
            if (!tokens.some(t => t.mint === token.mint)) {
              tokens.push({
                symbol: token.symbol,
                mint: token.mint,
                price: parseFloat(token.price || '0'),
                volume24h: parseFloat(token.volume24h || '0'),
                priceChange24h: parseFloat(token.priceChange24h || '0'),
                marketCap: parseFloat(token.marketCap || '0')
              });
            }
          });
        }
      }

      // Sort by volume and limit to top 10
      return tokens
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 10);

    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      throw error;
    }
  }

  /**
   * Format trending tokens response
   */
  private formatTrendingResponse(tokens: TrendingToken[]): string {
    if (!tokens.length) {
      return 'No trending tokens found at the moment.';
    }

    let response = '🔥 **Trending Tokens**\n\n';
    
    tokens.forEach((token, index) => {
      const priceChange = token.priceChange24h >= 0 ? '📈' : '📉';
      const priceChangeText = token.priceChange24h >= 0 ? '+' : '';
      
      response += `${index + 1}. **${token.symbol}**\n` +
        `   Price: $${token.price.toFixed(6)}\n` +
        `   24h Change: ${priceChange} ${priceChangeText}${token.priceChange24h.toFixed(2)}%\n` +
        `   24h Volume: $${this.formatNumber(token.volume24h)}\n` +
        `   Market Cap: $${this.formatNumber(token.marketCap)}\n\n`;
    });

    return response;
  }

  /**
   * Format large numbers
   */
  private formatNumber(num: number): string {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }
} 
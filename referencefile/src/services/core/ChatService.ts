import { ChatContext, ChatMessage } from '../../types/chat.js';
import { PriceService } from './PriceService.js';
import { TokenService } from './TokenService.js';
import { SwapService } from './SwapService.js';
import { TrendingService } from './TrendingService.js';
import { ServiceFactory } from './ServiceFactory.js';
import { setCache, getCache } from '../../redis/index.js';

export class ChatService {
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Process incoming chat message
   */
  async processMessage(message: string, context: ChatContext): Promise<string> {
    // Store user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    context.messages.push(userMessage);

    // Route message to appropriate handler
    const response = await this.routeMessage(message, context);

    // Store assistant response
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    };
    context.messages.push(assistantMessage);

    // Cache chat history if wallet address is provided
    if (context.walletAddress) {
      await this.cacheChatHistory(context.walletAddress, context.messages);
    }

    return response;
  }

  /**
   * Get chat history for a wallet address
   */
  async getChatHistory(walletAddress: string): Promise<ChatMessage[]> {
    const key = `chat:history:${walletAddress}`;
    const history = await getCache<ChatMessage[]>(key);
    return history || [];
  }

  /**
   * Route message to appropriate handler based on intent
   */
  private async routeMessage(message: string, context: ChatContext): Promise<string> {
    const serviceFactory = ServiceFactory.getInstance();

    if (this.isPriceQuery(message)) {
      const priceService = serviceFactory.getPriceService();
      return await priceService.handlePriceQuery(message, context);
    }

    if (this.isTokenCreationIntent(message)) {
      const tokenService = serviceFactory.getTokenService();
      return await tokenService.handleCreationIntent(message, context);
    }

    if (this.isSwapIntent(message)) {
      const swapService = serviceFactory.getSwapService();
      return await swapService.handleSwapIntent(message, context);
    }

    if (this.isTrendingQuery(message)) {
      const trendingService = serviceFactory.getTrendingService();
      return await trendingService.handleTrendingQuery(message, context);
    }

    return this.getGeneralResponse(message);
  }

  /**
   * Cache chat history
   */
  private async cacheChatHistory(walletAddress: string, messages: ChatMessage[]): Promise<void> {
    const key = `chat:history:${walletAddress}`;
    await setCache(key, messages, this.CACHE_TTL);
  }

  /**
   * Check if message is a price query
   */
  private isPriceQuery(message: string): boolean {
    const pricePatterns = [
      /price of (\w+)/i,
      /how much is (\w+)/i,
      /what's the price of (\w+)/i,
      /(\w+) price/i
    ];
    return pricePatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message indicates token creation intent
   */
  private isTokenCreationIntent(message: string): boolean {
    const creationPatterns = [
      /create (a |new )?token/i,
      /launch (a |new )?token/i,
      /make (a |new )?token/i
    ];
    return creationPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message indicates swap intent
   */
  private isSwapIntent(message: string): boolean {
    const swapPatterns = [
      /swap (\w+) (?:for|to) (\w+)/i,
      /trade (\w+) (?:for|to) (\w+)/i,
      /exchange (\w+) (?:for|to) (\w+)/i
    ];
    return swapPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is a trending query
   */
  private isTrendingQuery(message: string): boolean {
    const trendingPatterns = [
      /trending tokens/i,
      /hot tokens/i,
      /popular tokens/i,
      /what's trending/i
    ];
    return trendingPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Get general response for unrecognized queries
   */
  private getGeneralResponse(message: string): string {
    return "I'm not sure I understand. You can ask me about:\n" +
      "- Token prices\n" +
      "- Creating new tokens\n" +
      "- Swapping tokens\n" +
      "- Trending tokens\n\n" +
      "Please try rephrasing your question.";
  }
} 
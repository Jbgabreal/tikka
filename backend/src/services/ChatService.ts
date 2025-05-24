import axios from 'axios';
import { TokenPriceService } from './TokenPriceService';
import { UserPortfolioService } from './UserPortfolioService';

export class ChatService {
  private tokenPriceService: TokenPriceService;
  private userPortfolioService: UserPortfolioService;

  constructor() {
    this.tokenPriceService = new TokenPriceService();
    this.userPortfolioService = new UserPortfolioService();
  }

  private isPriceQuery(message: string): boolean {
    const priceKeywords = [
      'price',
      'cost',
      'value',
      'worth',
      'how much',
      'current price',
      'latest price',
      'token price',
      'price of',
    ];
    const lowerMessage = message.toLowerCase();
    const result = priceKeywords.some(keyword => lowerMessage.includes(keyword));
    console.log('[isPriceQuery]', { message, result });
    return result;
  }

  private isPortfolioQuery(message: string): boolean {
    const portfolioKeywords = [
      'portfolio',
      'my tokens',
      'my coins',
      'what do i own',
      'show my tokens',
      'show my portfolio',
      'wallet tokens',
      'wallet coins',
      'my assets',
      'list my tokens',
      'list my coins',
      'get portfolio',
      'portfolio performance',
      'my portfolio performance',
      'profile tokens',
      'my profile tokens',
      'portfolio summary',
      'portfolio value',
      'portfolio balance',
      'portfolio overview',
      'token holdings',
      'show holdings',
      'get my tokens',
      'get my portfolio',
      'display my portfolio',
      'display my tokens',
      'portfolio report',
      'wallet performance',
      'wallet summary',
      'wallet value'
    ];
    const lowerMessage = message.toLowerCase();
    const result = portfolioKeywords.some(keyword => lowerMessage.includes(keyword));
    console.log('[isPortfolioQuery]', { message, result });
    return result;
  }

  async chatWithDeepSeek(message: string, context: any = {}) {
    console.log('[chatWithDeepSeek] Received message:', message);
    // Portfolio query detection
    if (this.isPortfolioQuery(message)) {
      // Try to get wallet address from context
      const walletAddress = context.walletAddress || (context.user && context.user.walletAddress);
      if (!walletAddress) {
        return { prompt: 'Please connect your wallet to view your portfolio.' };
      }
      console.log('[chatWithDeepSeek] Routing to: portfolio service');
      const portfolioMsg = await this.userPortfolioService.formatPortfolioForChat(walletAddress);
      return { prompt: portfolioMsg };
    }
    // Price query detection
    if (this.isPriceQuery(message)) {
      try {
        console.log('[chatWithDeepSeek] Routing to: price service');
        const priceResponse = await this.tokenPriceService.handlePriceQuery(message);
        return { prompt: priceResponse.prompt };
      } catch (error) {
        console.error('Error handling price query:', error);
        // Fall back to DeepSeek if price query fails
        return { prompt: "Sorry, I couldn't fetch the price information at the moment. Please try again later." };
      }
    }
    console.log('[chatWithDeepSeek] Routing to: general chat');
    // If not a price or portfolio query, use DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          ...(context.messages || []),
          { role: 'user', content: message }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Always wrap DeepSeek response in prompt structure
    const content = response.data.choices?.[0]?.message?.content || 'No response from assistant.';
    return { prompt: content };
  }
} 
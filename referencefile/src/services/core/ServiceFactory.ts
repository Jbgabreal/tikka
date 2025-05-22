import { ChatService } from './ChatService.js';
import { PriceService } from './PriceService.js';
import { TokenService } from './TokenService.js';
import { SwapService } from './SwapService.js';
import { TrendingService } from './TrendingService.js';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private chatService: ChatService;
  private priceService: PriceService;
  private tokenService: TokenService;
  private swapService: SwapService;
  private trendingService: TrendingService;

  private constructor() {
    this.chatService = new ChatService();
    this.priceService = new PriceService();
    this.tokenService = new TokenService();
    this.swapService = new SwapService();
    this.trendingService = new TrendingService();
  }

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public getChatService(): ChatService {
    return this.chatService;
  }

  public getPriceService(): PriceService {
    return this.priceService;
  }

  public getTokenService(): TokenService {
    return this.tokenService;
  }

  public getSwapService(): SwapService {
    return this.swapService;
  }

  public getTrendingService(): TrendingService {
    return this.trendingService;
  }
} 
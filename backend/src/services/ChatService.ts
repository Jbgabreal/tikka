import axios from 'axios';
import OpenAI from 'openai';
import { TokenPriceService } from './TokenPriceService';
import { UserPortfolioService } from './UserPortfolioService';
import { TokenSwapService } from './TokenSwapService';
import { TokenCreationService } from './TokenCreationService';
import { TrendingService } from './TrendingService';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export class ChatService {
  public tokenPriceService: TokenPriceService;
  private userPortfolioService: UserPortfolioService;
  private tokenSwapService: TokenSwapService;
  private tokenCreationService: TokenCreationService;
  private trendingService: TrendingService;

  constructor() {
    this.tokenPriceService = new TokenPriceService();
    this.userPortfolioService = new UserPortfolioService();
    this.tokenSwapService = new TokenSwapService();
    this.tokenCreationService = new TokenCreationService();
    this.trendingService = new TrendingService();
  }

  public isPriceQuery(message: string): boolean {
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
      'wallet value',
      'my balance',
      'what is my balance',
      'balance',
      'show balance',
      'wallet balance',
      'account balance',
      'solana balance',
      'sol balance',
      'how much do i have',
      'how much sol do i have',
      'how much is in my wallet',
      'how much money do i have',
      'how much crypto do i have',
      'how much are my tokens worth',
      'how much are my coins worth',
    ];
    const lowerMessage = message.toLowerCase();
    const result = portfolioKeywords.some(keyword => lowerMessage.includes(keyword));
    console.log('[isPortfolioQuery]', { message, result });
    return result;
  }

  private isBotCapabilityQuery(message: string): boolean {
    const triggers = [
      "what can you do",
      "how can you help",
      "what are your features",
      "what can you do for me",
      "how do i use you",
      "what is this",
      "who are you",
      "what can this bot do",
      "what can this assistant do",
      "what can solchatta do",
      "help me",
      "your capabilities",
      "your features"
    ];
    const lower = message.toLowerCase();
    return triggers.some(trigger => lower.includes(trigger));
  }

  private isTrendingQuery(message: string): boolean {
    const trendingKeywords = [
      'trending',
      "what's new",
      'what is new',
      'what is trending',
      'top tokens',
      'top projects',
      'top protocols',
      'top coins',
      'top solana',
      'best tokens',
      'best projects',
      'best protocols',
      'best coins',
      'what is hot',
      'what is popular',
      'what is moving',
      'what is pumping',
      'what is active',
      'what is up',
      'what is happening',
      'what is going on',
      'what is new on solana',
      'what is new in solana',
      'what is new in defi',
      'what is new in crypto',
      'what is new in tokens',
      'what is new in coins',
    ];
    const lowerMessage = message.toLowerCase();
    return trendingKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private isSwapIntent(message: string): boolean {
    const swapKeywords = [
      'swap',
      'exchange',
      'trade',
      'convert',
      'swap token',
      'swap tokens',
      'exchange token',
      'exchange tokens',
      'trade token',
      'trade tokens',
      'convert token',
      'convert tokens'
    ];

    const lowerMessage = message.toLowerCase();
    return swapKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private isCreateTokenIntent(message: string): boolean {
    const createKeywords = [
      'create token',
      'create tokens',
      'launch token',
      'launch tokens',
      'mint token',
      'mint tokens',
      'deploy token',
      'deploy tokens',
      'new token',
      'new tokens',
      'token creation',
      'token launch',
      'token mint',
      'token deploy'
    ];

    const lowerMessage = message.toLowerCase();
    return createKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private formatTrendingTokens(tokens: any[]): string {
    if (!tokens || tokens.length === 0) {
      return 'No trending tokens found at the moment.';
    }

    let prompt = '🔥 **Top Trending Tokens on Solana**\n\n';
    
    tokens.forEach((token, index) => {
      const price = token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(6)}` : 'N/A';
      const change24h = token.priceChange?.h24 ? `${parseFloat(token.priceChange.h24).toFixed(2)}%` : 'N/A';
      const volume24h = token.volume?.h24 ? `$${(parseFloat(token.volume.h24) / 1000000).toFixed(2)}M` : 'N/A';
      
      prompt += `${index + 1}. **${token.baseToken?.symbol || 'Unknown'}**\n`;
      prompt += `   Price: ${price}\n`;
      prompt += `   24h Change: ${change24h}\n`;
      prompt += `   24h Volume: ${volume24h}\n`;
      prompt += `   Address: \`${token.baseToken?.address || 'N/A'}\`\n\n`;
    });

    return prompt;
  }

  async chatWithOpenAI(message: string, context: any = {}) {
    console.log('[chatWithOpenAI] Received message:', message);
    console.log('[chatWithOpenAI] Context:', context);
    console.log('[chatWithOpenAI] context.currentStep:', context.currentStep);
    console.log('[chatWithOpenAI] typeof context.currentStep:', typeof context.currentStep);
    console.log('[chatWithOpenAI] context.currentStep truthy:', !!context.currentStep);
    
      // Check if we're in a step flow - this takes priority over intent detection
      if (context.currentStep && context.currentStep !== null && context.currentStep !== undefined) {
        console.log('[chatWithOpenAI] Continuing step flow:', context.currentStep);
        
        // Determine which service to route to based on the step
        // Token creation steps (more specific, check first)
        if (context.currentStep === 'image' || context.currentStep === 'name' || 
            context.currentStep === 'symbol' || context.currentStep === 'description' ||
            context.currentStep === 'twitter' || context.currentStep === 'telegram' ||
            context.currentStep === 'website' || context.currentStep === 'pool' ||
            context.currentStep === 'amount' || context.currentStep === 'confirmation') {
          console.log('[chatWithOpenAI] Routing to: token creation service (step continuation)');
          try {
            const creationResult = await this.tokenCreationService.handleCreationIntent(message, context);
            if (!creationResult) {
              return { prompt: 'Token creation process interrupted. Please start over.', step: null };
            }
            return {
              prompt: creationResult.prompt,
              step: creationResult.step,
              action: 'create-token',
              unsignedTransaction: creationResult.unsignedTransaction,
              requireSignature: creationResult.requireSignature,
              tokenDetails: (creationResult as any).tokenDetails
            };
          } catch (error) {
            console.error('[chatWithOpenAI] Error in token creation step continuation:', error);
            return { prompt: 'Sorry, I encountered an error processing your token creation request. Please try again.', step: null };
          }
        }
        
        if (context.currentStep === 'fromToken' || context.currentStep === 'toToken') {
          console.log('[chatWithOpenAI] Routing to: swap service (step continuation)');
          try {
            const swapResult = await this.tokenSwapService.handleSwapIntent(message, context);
            return {
              prompt: swapResult.prompt,
              step: swapResult.step,
              action: 'swap',
              unsignedTransaction: swapResult.unsignedTransaction,
              requireSignature: swapResult.requireSignature,
              swapDetails: swapResult.swapDetails
            };
          } catch (error) {
            console.error('[chatWithOpenAI] Error in swap step continuation:', error);
            return { prompt: 'Sorry, I encountered an error processing your swap request. Please try again.', step: null };
          }
        }
    }
    
    // Special: Bot capability intent
    if (this.isBotCapabilityQuery(message)) {
      return {
        prompt: `🚀 **Welcome to Soltikka**\n\nYour AI-Powered Solana Assistant\n\nSoltikka empowers your crypto journey with powerful chat commands:\n\n🔄 **Token Swaps & Liquidity**\nEasily swap tokens and manage liquidity positions\n\n🎨 **Token Creation & Tracking**\nLaunch your own token or track existing collections\n\n📈 **Portfolio Monitoring**\nTrack your assets and get real-time price updates\n\n💬 **Natural Language DeFi**\nInteract with DeFi protocols using plain English\n\n**Quick Start Commands:**\n- "Create a token"\n- "Swap token"\n- "What is the price of BONK?"\n\n🔒 **Security First:** All actions require wallet confirmation. Soltikka never holds your funds.`
      };
    }
    // Portfolio query detection
    if (this.isPortfolioQuery(message)) {
      const walletAddress = context.walletAddress || (context.user && context.user.walletAddress);
      if (!walletAddress) {
        return { prompt: 'Please connect your wallet to view your portfolio.' };
      }
      console.log('[chatWithOpenAI] Routing to: portfolio service');
      const portfolioMsg = await this.userPortfolioService.formatPortfolioForChat(walletAddress);
      return { prompt: portfolioMsg };
    }
    // Price query detection
    if (this.isPriceQuery(message)) {
      try {
        console.log('[chatWithOpenAI] Routing to: price service');
        const priceResponse = await this.tokenPriceService.handlePriceQuery(message);
        return { prompt: priceResponse.prompt };
      } catch (error) {
        console.error('Error handling price query:', error);
        return { prompt: "Sorry, I couldn't fetch the price information at the moment. Please try again later." };
      }
    }
    // Swap intent detection
    console.log('[chatWithOpenAI] Checking swap intent for message:', message);
    const isSwap = this.isSwapIntent(message);
    console.log('[chatWithOpenAI] Is swap intent:', isSwap);
    if (isSwap) {
      console.log('[chatWithOpenAI] Routing to: swap service');
      try {
        const swapResult = await this.tokenSwapService.handleSwapIntent(message, context);
        return {
          prompt: swapResult.prompt,
          step: swapResult.step,
          action: 'swap',
          unsignedTransaction: swapResult.unsignedTransaction,
          requireSignature: swapResult.requireSignature,
          swapDetails: swapResult.swapDetails
        };
      } catch (error) {
        console.error('Error handling swap intent:', error);
        return { prompt: "Sorry, I couldn't process your swap request. Please try again." };
      }
    }
    
    // Create token intent detection
    if (this.isCreateTokenIntent(message)) {
      console.log('[chatWithOpenAI] Routing to: token creation service');
      try {
        const creationResult = await this.tokenCreationService.handleCreationIntent(message, context);
        if (!creationResult) {
          return { prompt: "Sorry, I couldn't process your token creation request. Please try again." };
        }
        return {
          prompt: creationResult.prompt,
          step: creationResult.step,
          action: 'create-token',
          unsignedTransaction: creationResult.unsignedTransaction,
          requireSignature: creationResult.requireSignature,
          tokenDetails: (creationResult as any).tokenDetails
        };
      } catch (error) {
        console.error('Error handling token creation intent:', error);
        return { prompt: "Sorry, I couldn't process your token creation request. Please try again." };
      }
    }
    
    // Trending/general intent detection
    if (this.isTrendingQuery(message)) {
      console.log('[chatWithOpenAI] Routing to: trending service');
      try {
        const trendingTokens = await this.trendingService.getTrending(10);
        const trendingPrompt = this.formatTrendingTokens(trendingTokens);
        return { 
          prompt: trendingPrompt,
          action: 'trending'
        };
      } catch (error) {
        console.error('Error handling trending intent:', error);
        return { prompt: "Sorry, I couldn't fetch trending tokens at the moment. Please try again later." };
      }
    }
    // If a custom system prompt is provided (e.g., degen personality), always use it and skip Solana keyword check
    if (context.systemPrompt) {
      if (!openai) {
        return { prompt: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' };
      }
      const messages = [
        { role: 'system', content: context.systemPrompt },
        ...(context.messages || [])
          .filter((m: any) => typeof m.content === 'string')
          .map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
      });
      const content = completion.choices?.[0]?.message?.content || 'No response from assistant.';
      return { prompt: content };
    }
    // If the message is unrelated to Solana/SPL/DeFi, redirect politely (only if no custom system prompt)
    const solanaKeywords = ['solana', 'spl', 'defi', 'token', 'coin', 'protocol', 'wallet', 'nft', 'jupiter', 'pump.fun', 'magic eden', 'dex', 'solscan', 'blockchain', 'crypto'];
    const lowerMessage = message.toLowerCase();
    const isSolanaRelated = solanaKeywords.some(keyword => lowerMessage.includes(keyword));
    if (!isSolanaRelated) {
      return { prompt: "I'm here to help with Solana and SPL token questions. Ask me anything about Solana DeFi!" };
    }
    // Otherwise, always answer in the context of Solana/SPL/DeFi
    console.log('[chatWithOpenAI] Routing to: general chat (OpenAI, Solana context)');
    
    if (!openai) {
      return { 
        prompt: 'I\'m Soltikka, your Solana DeFi assistant! I can help you with token swaps, portfolio tracking, trending tokens, and more. However, I need an OpenAI API key to provide detailed responses. Please set the OPENAI_API_KEY environment variable.' 
      };
    }
    
    const systemPrompt = `You are Soltikka, an expert Solana DeFi chatbot. You only answer questions about the Solana blockchain, SPL tokens, Solana DeFi, and the Solana ecosystem (WCO = whole crypto ecosystem on Solana). If a user asks a general or ambiguous question (such as 'what is trending' or 'what's new'), always assume they are referring to the Solana ecosystem and respond with information relevant to Solana tokens, protocols, news, or trends. If a question is completely unrelated to Solana, politely redirect the user to ask about Solana or SPL tokens. Never answer questions outside the Solana/SPL/DeFi domain. Always interpret general questions as Solana-related. All your answers must be strictly about Solana, SPL tokens, Solana DeFi, or the Solana ecosystem (WCO).`;
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.messages || [])
        .filter((m: any) => typeof m.content === 'string')
        .map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });
    const content = completion.choices?.[0]?.message?.content || 'No response from assistant.';
    return { prompt: content };
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
import { Connection, PublicKey } from '@solana/web3.js';
import { query } from '../database/index.js';
import { 
  getTokenLiquidity, 
  getTokenHolders,
  executeTrade,
  createToken
} from './pumpportal.js';
import { getTokenPrice, getTokenPriceBySymbol, getCachedTokenPrice, getCachedTokenPriceBySymbol } from './tokenPrice.js';
import { getGasEstimate } from './token.js';
import { getBridgeStatus } from './bridge.js';
import { getTokenAddress, extractTokenSymbol } from './tokenMapping.js';
import OpenAI from 'openai';
import axios from 'axios';
import { cacheChatResponse, getCachedChatResponse } from '../redis/index.js';
import { ChatContext, ChatMessage, ChatResponse, TokenCreationSession, SwapSession } from '../types/chat.js';
import { getTokenCreationSession, clearTokenCreationSession } from './token.js';
import { executeSwap, getSwapSession, clearSwapSession } from './swap.js';
import { getTrendingTokens } from './trending.js';
import { setCache, getCache } from '../redis/index.js';

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function openaiChat(message: string, context: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
  });
  return completion.choices[0].message.content;
}

async function deepseekChat(message: string, context: any) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat', // or the model name from DeepSeek docs
      messages: [
        ...context.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
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
  return response.data.choices[0].message.content || "Sorry, I couldn't generate a response.";
}

const CACHE_TTL = 3600; // 1 hour

export class ChatService {
  /**
   * Process incoming chat message
   */
  async processMessage(message: string, context: ChatContext): Promise<ChatResponse> {
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
      content: response.response,
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
   * Route message to appropriate handler based on intent
   */
  private async routeMessage(message: string, context: ChatContext): Promise<ChatResponse> {
    const lowerMessage = message.toLowerCase();

    // Check for price queries
    if (this.isPriceQuery(lowerMessage)) {
      return await this.handlePriceQuery(message, context);
    }

    // Check for token creation
    if (this.isTokenCreationIntent(lowerMessage)) {
      return await this.handleTokenCreation(message, context);
    }

    // Check for swap intent
    if (this.isSwapIntent(lowerMessage)) {
      return await this.handleSwap(message, context);
    }

    // Check for trending tokens
    if (this.isTrendingQuery(lowerMessage)) {
      return await this.handleTrendingQuery(context);
    }

    // Default to general response
    return this.getGeneralResponse(message);
  }

  /**
   * Handle price queries
   */
  private async handlePriceQuery(message: string, context: ChatContext): Promise<ChatResponse> {
    const tokenMint = this.extractTokenMint(message);
    if (tokenMint) {
      try {
        const price = await getTokenPrice(tokenMint);
        return {
          response: `The current price of this token (${tokenMint.slice(0, 8)}...) is $${price.toFixed(6)} USD.`
        };
      } catch (error) {
        console.error(`Error fetching price for token mint ${tokenMint}:`, error);
        return {
          response: `I couldn't retrieve the current price for this token. Please try again later.`
        };
      }
    }

    const tokenSymbol = this.extractTokenSymbol(message);
    if (tokenSymbol) {
      try {
        const price = await getTokenPriceBySymbol(tokenSymbol);
        return {
          response: `The current price of ${tokenSymbol.toUpperCase()} is $${price.toFixed(6)} USD.`
        };
      } catch (error) {
        console.error(`Error fetching price for ${tokenSymbol}:`, error);
        return {
          response: `I couldn't retrieve the current price for ${tokenSymbol.toUpperCase()}. Please try again later.`
        };
      }
    }

    return {
      response: "I couldn't identify which token you're asking about. Please specify the token symbol or address."
    };
  }

  /**
   * Handle token creation
   */
  private async handleTokenCreation(message: string, context: ChatContext): Promise<ChatResponse> {
    const userId = context.walletAddress;
    if (!userId) {
      return {
        response: 'Please connect your wallet to create a token.'
      };
    }

    let session = await getTokenCreationSession(userId) as TokenCreationSession || { step: null };
    
    if (!session.step) {
      session.step = 'name';
      await this.saveTokenCreationSession(userId, session);
      return {
        response: "Let's create your token! What would you like to name your token?",
        step: 'name'
      };
    }

    return this.handleTokenCreationStep(session, message, userId);
  }

  /**
   * Handle swap requests
   */
  private async handleSwap(message: string, context: ChatContext): Promise<ChatResponse> {
    const userId = context.walletAddress;
    if (!userId) {
      return {
        response: 'Please connect your wallet to perform a swap.'
      };
    }

    let session = await getSwapSession(userId) as SwapSession || { step: null };
    
    if (!session.step) {
      session.step = 'fromToken';
      await this.saveSwapSession(userId, session);
      return {
        response: 'Which token do you want to swap from? (symbol or mint address)',
        step: 'fromToken'
      };
    }

    return this.handleSwapStep(session, message, userId);
  }

  /**
   * Handle trending tokens query
   */
  private async handleTrendingQuery(context: ChatContext): Promise<ChatResponse> {
    try {
      const trendingTokens = await getTrendingTokens('24h');
      const formattedTokens = trendingTokens
        .slice(0, 5)
        .map(token => `${token.symbol}: $${token.price.toFixed(6)} (${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%)`)
        .join('\n');

      return {
        response: `Here are the top 5 trending tokens in the last 24 hours:\n${formattedTokens}`
      };
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return {
        response: 'Sorry, I encountered an error while fetching trending tokens. Please try again later.'
      };
    }
  }

  /**
   * Get general response for non-specific queries
   */
  private getGeneralResponse(message: string): ChatResponse {
    return {
      response: "I'm here to help you with token-related queries. You can ask me about token prices, create new tokens, perform swaps, or check trending tokens. What would you like to know?"
    };
  }

  /**
   * Helper methods for intent detection
   */
  private isPriceQuery(message: string): boolean {
    return /price|how much|worth|value/i.test(message);
  }

  private isTokenCreationIntent(message: string): boolean {
    return /create|make|launch|deploy|mint.*token|token creation|new token/i.test(message);
  }

  private isSwapIntent(message: string): boolean {
    return /swap|trade|exchange|convert.*token|token swap/i.test(message);
  }

  private isTrendingQuery(message: string): boolean {
    return /trending|popular|top.*tokens|hot tokens/i.test(message);
  }

  /**
   * Helper methods for token identification
   */
  private extractTokenMint(message: string): string | null {
    const mintMatch = message.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    return mintMatch ? mintMatch[0] : null;
  }

  private extractTokenSymbol(message: string): string | null {
    const symbolMatch = message.match(/\b[A-Z]{2,10}\b/);
    return symbolMatch ? symbolMatch[0] : null;
  }

  /**
   * Session management methods
   */
  private async saveTokenCreationSession(userId: string, session: TokenCreationSession): Promise<void> {
    await setCache(`token_creation:${userId}`, session, CACHE_TTL);
  }

  private async saveSwapSession(userId: string, session: SwapSession): Promise<void> {
    await setCache(`swap:${userId}`, session, CACHE_TTL);
  }

  /**
   * Chat history management
   */
  async getChatHistory(walletAddress: string): Promise<ChatHistory> {
    const history = await getCache(`chat_history:${walletAddress}`) || [];
    return { history };
  }

  private async cacheChatHistory(walletAddress: string, messages: ChatMessage[]): Promise<void> {
    const history = messages.map(msg => ({
      message: msg.content,
      response: msg.role === 'assistant' ? msg.content : '',
      timestamp: new Date(msg.timestamp).toISOString()
    }));
    await setCache(`chat_history:${walletAddress}`, history, CACHE_TTL);
  }
}

/**
 * Store chat history in database
 */
export async function storeChatHistory(userId: string, messages: ChatMessage[]): Promise<void> {
  try {
    await query(
      `INSERT INTO chat_history (user_id, messages)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET messages = $2`,
      [userId, JSON.stringify(messages)]
    );
  } catch (error) {
    console.error('Error storing chat history:', error);
  }
}

/**
 * Retrieve chat history from database
 */
export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  try {
    const result = await query(
      'SELECT messages FROM chat_history WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.messages || [];
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return [];
  }
} 
import axios from 'axios';
import WebSocket from 'ws';
import { config } from 'dotenv';
import { query } from '../database/index.js';

// Load environment variables
config();

const PUMPPORTAL_API_URL = process.env.PUMPPORTAL_API_URL || 'https://pumpportal.fun/api';
const PUMPPORTAL_WS_URL = process.env.PUMPPORTAL_WS_URL || 'wss://pumpportal.fun/api/data';
const API_KEY = process.env.PUMPPORTAL_API_KEY;

interface TradeParams {
  action: 'buy' | 'sell';
  mint: string;
  amount: number;
  denominatedInSol: boolean;
  slippage: number;
  priorityFee: number;
  pool?: 'pump' | 'raydium' | 'pump-amm' | 'auto';
  skipPreflight?: boolean;
  jitoOnly?: boolean;
}

interface TokenCreationParams {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  initialLiquidity: number;
}

/**
 * Execute a trade using PumpPortal API
 */
export async function executeTrade(params: TradeParams): Promise<{ signature: string }> {
  try {
    const response = await axios.post(
      `${PUMPPORTAL_API_URL}/trade?api-key=${API_KEY}`,
      {
        ...params,
        skipPreflight: params.skipPreflight ?? true,
        jitoOnly: params.jitoOnly ?? false,
        pool: params.pool ?? 'auto'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Trade execution failed:', error);
    throw new Error('Failed to execute trade');
  }
}

/**
 * Create a new token using PumpPortal API
 */
export async function createToken(params: TokenCreationParams): Promise<{ mint: string }> {
  try {
    const response = await axios.post(
      `${PUMPPORTAL_API_URL}/create-token?api-key=${API_KEY}`,
      params
    );
    return response.data;
  } catch (error) {
    console.error('Token creation failed:', error);
    throw new Error('Failed to create token');
  }
}

/**
 * Subscribe to real-time token updates
 */
export function subscribeToTokenUpdates(tokenMint: string, callback: (data: any) => void): WebSocket {
  const ws = new WebSocket(PUMPPORTAL_WS_URL);

  ws.on('open', () => {
    // Subscribe to token trades
    ws.send(JSON.stringify({
      method: 'subscribeTokenTrade',
      keys: [tokenMint]
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    callback(message);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return ws;
}

/**
 * Get token price from PumpPortal
 */
export async function getTokenPrice(mint: string): Promise<number> {
  try {
    const response = await axios.get(`${PUMPPORTAL_API_URL}/price/${mint}?api-key=${API_KEY}`);
    
    if (response.data && typeof response.data.price === 'number') {
      return response.data.price;
    } else if (response.data && typeof response.data.usdPrice === 'number') {
      return response.data.usdPrice;
    } else {
      console.error('Invalid price response format:', response.data);
      throw new Error('Invalid price response format');
    }
  } catch (error: any) {
    console.error('Failed to get token price:', error);
    throw new Error(`Failed to get token price: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get token liquidity from PumpPortal
 */
export async function getTokenLiquidity(mint: string): Promise<{ sol: number; tokens: number }> {
  try {
    const response = await axios.get(`${PUMPPORTAL_API_URL}/liquidity/${mint}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get token liquidity:', error);
    throw new Error('Failed to get token liquidity');
  }
}

/**
 * Get token holders from PumpPortal
 */
export async function getTokenHolders(mint: string): Promise<Array<{ address: string; balance: number }>> {
  try {
    const response = await axios.get(`${PUMPPORTAL_API_URL}/holders/${mint}`);
    return response.data.holders;
  } catch (error) {
    console.error('Failed to get token holders:', error);
    throw new Error('Failed to get token holders');
  }
}

export async function saveUserToken(userId: string, tokenData: { mint: string, name: string, symbol: string, image: string }): Promise<void> {
  await query(
    `INSERT INTO user_tokens (user_id, mint, name, symbol, image, enabled)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     ON CONFLICT (user_id, mint) DO NOTHING`,
    [userId, tokenData.mint, tokenData.name, tokenData.symbol, tokenData.image]
  );
} 
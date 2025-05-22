import cron from 'node-cron';
import { Connection, PublicKey } from '@solana/web3.js';
import { query } from '../database/index.js';
import { broadcastTokenPrice } from '../websocket/index.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

// Setup cron jobs
export function setupCronJobs() {
  // Only run once a day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily token metadata update...');
    try {
      await updateTokenMetadata();
    } catch (error) {
      console.error('Daily token metadata update failed:', error);
    }
  });
}

// Update token metadata
async function updateTokenMetadata() {
  const tokens = await query('SELECT * FROM tokens');
  for (const token of tokens.rows) {
    try {
      const supply = await connection.getTokenSupply(new PublicKey(token.address));
      await query(
        'UPDATE tokens SET supply = $1 WHERE address = $2',
        [supply.value.amount, token.address]
      );
    } catch (error) {
      console.error(`Error updating metadata for token ${token.address}:`, error);
      // Throw the error to stop processing after fallbacks
      throw error;
    }
  }
}

// Update token prices
// async function updateTokenPrices() {
//   try {
//     // Get all tokens from database
//     const result = await query('SELECT address, symbol FROM token_metadata');
//     const tokens = result.rows;
//
//     for (const token of tokens) {
//       try {
//         // Fetch price from multiple sources
//         const [dexscreenerPrice, raydiumPrice, orcaPrice] = await Promise.all([
//           getDexscreenerPrice(token.symbol),
//           getRaydiumPrice(token.symbol),
//           getOrcaPrice(token.symbol)
//         ]);
//
//         // Calculate average price
//         const prices = [dexscreenerPrice, raydiumPrice, orcaPrice].filter(price => price !== null);
//         const averagePrice = prices.reduce((sum, price) => sum + price!, 0) / prices.length;
//
//         // Broadcast price update
//         broadcastTokenPrice(token.symbol, averagePrice);
//
//         console.log(`Updated price for token: ${token.symbol}`);
//       } catch (error) {
//         console.error(`Error updating price for token ${token.symbol}:`, error);
//       }
//     }
//   } catch (error) {
//     console.error('Error in updateTokenPrices:', error);
//     throw error;
//   }
// }

// Helper functions for price fetching
async function getDexscreenerPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${symbol}`);
    const data = await response.json();
    return data.pairs[0]?.priceUsd || null;
  } catch {
    return null;
  }
}

async function getRaydiumPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.raydium.io/v2/main/price?symbol=${symbol}`);
    const data = await response.json();
    return data.price || null;
  } catch {
    return null;
  }
}

async function getOrcaPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch('https://api.orca.so/pools');
    const data = await response.json();
    const pool = data.find((p: any) => p.tokenSymbol === symbol);
    return pool?.price || null;
  } catch {
    return null;
  }
} 
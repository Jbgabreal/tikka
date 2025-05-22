import cron from 'node-cron';
import { query } from '../database/index.js';
import { getTokenPrice, storeTokenPrice } from './tokenPrice.js';
import axios from 'axios';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
const MORALIS_TRENDING_URL = 'https://deep-index.moralis.io/api/v2.2/tokens/trending?chain=solana';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  // Price tracking job - runs every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running price tracking cron job (top 10 trending only)...');
    try {
      // 1. Fetch top 10 trending tokens from Moralis
      const moralisRes = await axios.get(MORALIS_TRENDING_URL, {
        headers: { 'X-API-Key': MORALIS_API_KEY }
      });
      const trending = moralisRes.data.result || moralisRes.data || [];
      const topTrending = trending.slice(0, 10);

      let successCount = 0, errorCount = 0;

      // 2. Update prices for only the top 10 trending tokens
      await Promise.all(topTrending.map(async (token: any) => {
        const mint = token.tokenAddress || token.address;
        try {
          const price = token.usdPrice; // or fetch from your price service if needed
          if (price) {
            await storeTokenPrice(mint, price, 'moralis');
            console.log(`Updated price for trending token: ${token.symbol}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error updating price for trending token ${token.symbol}:`, error);
          errorCount++;
        }
      }));

      console.log(`Trending price tracking completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error in trending price tracking cron job:', error);
    }
  });

  // Cleanup old prices job - runs daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running price cleanup cron job...');
    try {
      // Keep only the last 30 days of price data
      const result = await query(
        'DELETE FROM token_prices WHERE timestamp < NOW() - INTERVAL \'30 days\''
      );
      console.log(`Cleaned up ${result.rowCount} old price records`);
    } catch (error) {
      console.error('Error in price cleanup cron job:', error);
    }
  });
} 
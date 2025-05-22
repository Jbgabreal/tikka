import { getTokenPrice, getTokenPriceBySymbol } from './src/services/tokenPrice.js';
import { initializeTokenMetadata } from './src/services/raydium.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testTokenPriceService() {
  // Ensure Raydium service is initialized
  await initializeTokenMetadata();
  
  // Test mint addresses (using known working addresses)
  const testMints = [
    { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
    { symbol: 'ETH', mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk' },
    { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' }
  ];
  
  console.log('Testing getTokenPrice with mint addresses:');
  for (const { symbol, mint } of testMints) {
    try {
      const price = await getTokenPrice(mint);
      console.log(`${symbol} (${mint.substring(0, 8)}...): $${price.toFixed(6)}`);
    } catch (error) {
      console.error(`Failed to get price for ${symbol} (${mint}):`, error.message);
    }
  }
  
  console.log('\nTesting getTokenPriceBySymbol:');
  const testSymbols = ['SOL', 'USDC', 'BONK', 'ETH', 'WIF', 'JUP'];
  for (const symbol of testSymbols) {
    try {
      const price = await getTokenPriceBySymbol(symbol);
      console.log(`${symbol}: $${price.toFixed(6)}`);
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error.message);
    }
  }
}

console.log('Testing unified token price service...');
testTokenPriceService().catch(console.error); 
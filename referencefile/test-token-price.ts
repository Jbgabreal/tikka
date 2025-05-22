import { getTokenAddress, extractTokenSymbol, initializeTokenMap } from './src/services/tokenMapping.js';
import { getTokenPrice } from './src/services/pumpportal.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testTokenPriceQuery() {
  // Initialize token map
  await initializeTokenMap();
  
  // Test messages
  const testMessages = [
    "What is the price of BONK?",
    "How much is $WIF worth?",
    "JUP price today",
    "Get me the price of SOL"
  ];
  
  // Test extraction, address lookup, and price query
  for (const message of testMessages) {
    console.log(`\nTest message: "${message}"`);
    
    const symbol = extractTokenSymbol(message);
    console.log(`Extracted symbol: ${symbol || 'None'}`);
    
    if (symbol) {
      const address = getTokenAddress(symbol);
      console.log(`Token address for ${symbol}: ${address || 'Not found'}`);
      
      if (address) {
        try {
          const price = await getTokenPrice(address);
          console.log(`Price of ${symbol}: $${price}`);
        } catch (error) {
          console.error(`Failed to get price for ${symbol}:`, error.message);
        }
      }
    }
  }
}

// Run the test
testTokenPriceQuery().catch(console.error); 
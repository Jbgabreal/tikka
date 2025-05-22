import { getTokenAddress, extractTokenSymbol, initializeTokenMap } from './src/services/tokenMapping.js';

async function testTokenMapping() {
  // Initialize token map
  await initializeTokenMap();
  
  // Test messages
  const testMessages = [
    "What is the price of BONK?",
    "How much is $WIF worth?",
    "JUP price today",
    "Get me the price of SOL",
    "PYTH token",
    "RAY"
  ];
  
  // Test extraction and address lookup
  for (const message of testMessages) {
    console.log(`\nTest message: "${message}"`);
    
    const symbol = extractTokenSymbol(message);
    console.log(`Extracted symbol: ${symbol || 'None'}`);
    
    if (symbol) {
      const address = getTokenAddress(symbol);
      console.log(`Token address for ${symbol}: ${address || 'Not found'}`);
    }
  }
}

// Run the test
testTokenMapping().catch(console.error); 
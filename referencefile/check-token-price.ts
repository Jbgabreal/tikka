import { getTokenPrice, getTokenPriceBySymbol } from './src/services/tokenPrice.js';
import { initializeTokenMetadata } from './src/services/raydium.js';
import { initializeTokenMap } from './src/services/tokenMapping.js';
import { config } from 'dotenv';
import readline from 'readline';

// Load environment variables
config();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function initialize() {
  console.log('Initializing token services...');
  await Promise.all([
    initializeTokenMap(),
    initializeTokenMetadata()
  ]);
  console.log('Token services initialized!\n');
}

function promptUser() {
  rl.question(
    'Enter a token symbol (e.g., BONK, SOL) or mint address, or type "quit" to exit: ',
    async (input) => {
      const trimmedInput = input.trim();
      
      if (trimmedInput.toLowerCase() === 'quit' || trimmedInput.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }
      
      try {
        // Check if input is a mint address (32+ characters) or a symbol
        if (trimmedInput.length >= 32) {
          console.log(`Treating "${trimmedInput}" as a mint address...`);
          const price = await getTokenPrice(trimmedInput);
          console.log(`Price: $${price.toFixed(6)} USD\n`);
        } else {
          console.log(`Treating "${trimmedInput}" as a token symbol...`);
          const price = await getTokenPriceBySymbol(trimmedInput);
          console.log(`Price of ${trimmedInput.toUpperCase()}: $${price.toFixed(6)} USD\n`);
        }
      } catch (error) {
        console.error(`Error: ${error.message}\n`);
      }
      
      // Ask for next input
      promptUser();
    }
  );
}

async function run() {
  await initialize();
  console.log('---------------------------------------------------');
  console.log('Welcome to the Token Price Checker!');
  console.log('This tool uses PumpPortal and Raydium as price sources.');
  console.log('---------------------------------------------------\n');
  promptUser();
}

run().catch(console.error); 
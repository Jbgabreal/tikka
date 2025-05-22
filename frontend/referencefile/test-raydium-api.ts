import { 
  initializeTokenMetadata, 
  getTokenPriceBySymbol, 
  getTokenPriceByMint, 
  getMintAddressBySymbol,
  getSymbolByMintAddress,
  getTokenNameByMint
} from './src/services/raydium.js';

async function testRaydiumAPI() {
  console.log('Initializing Raydium token metadata...');
  await initializeTokenMetadata();
  
  // Test tokens to query
  const testSymbols = ['SOL', 'BONK', 'WIF', 'JUP', 'USDC', 'PYUSD', 'ETH'];
  
  console.log('\nTesting symbol to mint address mapping:');
  const mintAddresses: string[] = [];
  for (const symbol of testSymbols) {
    const mintAddress = getMintAddressBySymbol(symbol);
    console.log(`Mint address for ${symbol}: ${mintAddress || 'Not found'}`);
    
    if (mintAddress) {
      mintAddresses.push(mintAddress);
    }
  }
  
  if (mintAddresses.length > 0) {
    console.log('\nTesting mint address to symbol mapping:');
    for (const mintAddress of mintAddresses) {
      const symbol = getSymbolByMintAddress(mintAddress);
      const name = getTokenNameByMint(mintAddress);
      console.log(`${mintAddress}: Symbol=${symbol || 'Unknown'}, Name=${name || 'Unknown'}`);
    }
    
    console.log('\nTesting getTokenPriceByMint:');
    for (const mintAddress of mintAddresses) {
      try {
        const price = await getTokenPriceByMint(mintAddress);
        const symbol = getSymbolByMintAddress(mintAddress);
        console.log(`Price of ${symbol} (${mintAddress.substring(0, 8)}...): ${price ? '$' + price.toFixed(6) : 'Not found'}`);
      } catch (error) {
        console.error(`Error fetching price for mint ${mintAddress}:`, error);
      }
    }
  }
  
  console.log('\nTesting getTokenPriceBySymbol:');
  for (const symbol of testSymbols) {
    try {
      const price = await getTokenPriceBySymbol(symbol);
      console.log(`Price of ${symbol}: ${price ? '$' + price.toFixed(6) : 'Not found'}`);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    }
  }
}

console.log('Testing Raydium API...');
testRaydiumAPI().catch(console.error); 
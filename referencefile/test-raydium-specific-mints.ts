import axios from 'axios';

// Mint addresses we found working in the direct test
const MINT_ADDRESSES = [
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk', // ETH
  'So11111111111111111111111111111111111111112',  // SOL (native wrapped)
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
];

// Known symbols for the mint addresses
const MINT_TO_SYMBOL = {
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': 'PYUSD',
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk': 'ETH',
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC'
};

async function testSpecificMintPrices() {
  try {
    console.log('Fetching prices from Raydium for specific mint addresses...');
    const response = await axios.get('https://api.raydium.io/v2/main/price');
    
    if (response.status === 200) {
      console.log('API call successful');
      
      for (const mintAddress of MINT_ADDRESSES) {
        const price = response.data[mintAddress];
        const symbol = MINT_TO_SYMBOL[mintAddress] || 'Unknown';
        
        if (price !== undefined) {
          console.log(`Price for ${symbol} (${mintAddress}): $${price}`);
        } else {
          console.log(`No price found for ${symbol} (${mintAddress})`);
        }
      }
      
      // Check for any prices at all
      const allPrices = Object.entries(response.data);
      if (allPrices.length > 0) {
        console.log('\nSample price entries (first 5):');
        for (let i = 0; i < Math.min(5, allPrices.length); i++) {
          console.log(`${allPrices[i][0]}: ${allPrices[i][1]}`);
        }
      } else {
        console.log('No prices found in the response');
      }
    } else {
      console.log('API call failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
}

testSpecificMintPrices().catch(console.error); 
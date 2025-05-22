import axios from 'axios';

const RAYDIUM_API_URL = 'https://api.raydium.io/v2/main';
const RAYDIUM_TOKEN_LIST_URL = 'https://api.raydium.io/v2/sdk/token/raydium.mainnet.json';

async function testRaydiumPriceAPI() {
  try {
    console.log('Fetching prices from Raydium...');
    const response = await axios.get(`${RAYDIUM_API_URL}/price`);
    console.log('Response status:', response.status);
    
    // Check overall response
    if (response.data) {
      console.log('Response data type:', typeof response.data);
      console.log('Number of tokens with prices:', Object.keys(response.data).length);
      
      // Log the first 10 keys to understand data structure
      const keys = Object.keys(response.data).slice(0, 10);
      console.log('\nFirst 10 keys in response:');
      console.log(keys);
      
      // Log a few price entries
      console.log('\nSample price entries:');
      for (let i = 0; i < Math.min(5, keys.length); i++) {
        const key = keys[i];
        console.log(`${key}: ${response.data[key]}`);
      }
      
      // Check some common tokens
      const tokensToCheck = ['SOL', 'BONK', 'USDC', 'ETH', 'BTC'];
      console.log('\nSample token prices:');
      for (const token of tokensToCheck) {
        console.log(`${token}: ${response.data[token] !== undefined ? response.data[token] : 'Not found'}`);
      }
      
      // Check lowercase versions
      console.log('\nLowercase token prices:');
      for (const token of tokensToCheck) {
        console.log(`${token.toLowerCase()}: ${response.data[token.toLowerCase()] !== undefined ? response.data[token.toLowerCase()] : 'Not found'}`);
      }
    } else {
      console.log('No data received in response');
    }
  } catch (error) {
    console.error('Error fetching Raydium prices:', error);
  }
}

async function testRaydiumTokenList() {
  try {
    console.log('\nFetching token list from Raydium...');
    const response = await axios.get(RAYDIUM_TOKEN_LIST_URL);
    console.log('Response status:', response.status);
    
    // Log the raw response structure
    console.log('Response data keys:', Object.keys(response.data));
    
    if (response.data && response.data.tokens) {
      console.log('Number of tokens in list:', response.data.tokens.length);
      
      // Show a sample token
      if (response.data.tokens.length > 0) {
        console.log('\nSample token metadata:');
        console.log(response.data.tokens[0]);
      }
    } else {
      console.log('No tokens array found. Raw data structure:');
      console.log(JSON.stringify(response.data).slice(0, 500) + '...');
    }
  } catch (error) {
    console.error('Error fetching Raydium token list:', error);
  }
}

async function runTests() {
  await testRaydiumPriceAPI();
  await testRaydiumTokenList();
}

runTests().catch(console.error); 
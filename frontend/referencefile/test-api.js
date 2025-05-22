import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration
const API_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'; // Use environment variable or fallback
const TEST_WALLET = '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M'; // Example Solana wallet address

// Generate a test token
const token = jwt.sign({ wallet: TEST_WALLET, role: 'user' }, JWT_SECRET);

// Configure axios with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Test functions
async function testGetTokenPrice() {
  try {
    const response = await api.get('/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/price');
    console.log('Token Price:', response.data);
  } catch (error) {
    console.error('Error getting token price:', error.response?.data || error.message);
  }
}

async function testGetTokenLiquidity() {
  try {
    const response = await api.get('/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/liquidity');
    console.log('Token Liquidity:', response.data);
  } catch (error) {
    console.error('Error getting token liquidity:', error.response?.data || error.message);
  }
}

async function testGetTokenHolders() {
  try {
    const response = await api.get('/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/holders');
    console.log('Token Holders:', response.data);
  } catch (error) {
    console.error('Error getting token holders:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Testing PumpPortal API...\n');
  console.log('Using test wallet:', TEST_WALLET);
  console.log('API URL:', API_URL);
  console.log('Token:', token.substring(0, 20) + '...\n');
  
  console.log('1. Testing get token price...');
  await testGetTokenPrice();
  
  console.log('\n2. Testing get token liquidity...');
  await testGetTokenLiquidity();
  
  console.log('\n3. Testing get token holders...');
  await testGetTokenHolders();
}

runTests().catch(console.error); 
import axios from 'axios';

const PUMPPORTAL_API_URL = process.env.PUMPPORTAL_API_URL || 'https://pumpportal.fun/api';
const API_KEY = process.env.PUMPPORTAL_API_KEY || '';

async function testPumpPortal() {
  try {
    // Example: Fetch trending tokens (adjust endpoint as needed)
    const response = await axios.get(`${PUMPPORTAL_API_URL}/trending?api-key=${API_KEY}`);
    console.log('PumpPortal API response:', response.data);
  } catch (error) {
    console.error('Failed to connect to PumpPortal API:', error);
  }
}

testPumpPortal(); 
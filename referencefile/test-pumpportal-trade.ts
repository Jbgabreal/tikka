import axios from 'axios';

const PUMPPORTAL_API_URL = 'https://pumpportal.fun/api/trade-local';

// Replace these with your actual test values
const testBody = {
  publicKey: 'your-public-key',      // <-- Replace with your wallet public key
  action: 'buy',                     // "buy" or "sell"
  mint: 'So11111111111111111111111111111111111111112', // Example: SOL wrapped token
  denominatedInSol: 'false',         // "true" if amount is SOL, "false" if tokens
  amount: 1,                         // Amount of tokens or SOL
  slippage: 10,                      // Percent slippage allowed
  priorityFee: 0.00001,              // Priority fee
  pool: 'pump'                       // "pump", "raydium", "pump-amm", or "auto"
};

async function testPumpPortalTrade() {
  try {
    const response = await axios.post(PUMPPORTAL_API_URL, testBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 200) {
      console.log('PumpPortal trade-local response:', response.data);
    } else {
      console.log('PumpPortal trade-local error:', response.status, response.statusText);
    }
  } catch (error: any) {
    if (error.response) {
      console.error('PumpPortal trade-local error:', error.response.status, error.response.data);
    } else {
      console.error('PumpPortal trade-local error:', error.message);
    }
  }
}

testPumpPortalTrade(); 
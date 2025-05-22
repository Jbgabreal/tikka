import { Connection } from '@solana/web3.js';

const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcUrl);

async function testConnection() {
  try {
    const slot = await connection.getSlot();
    console.log(`Successfully connected to Solana RPC! Current slot: ${slot}`);
  } catch (error) {
    console.error('Failed to connect to Solana RPC:', error);
  }
}

testConnection(); 
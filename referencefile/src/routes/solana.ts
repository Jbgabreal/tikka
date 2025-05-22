import { Router } from 'express';
import fetch from 'node-fetch';
import axios from 'axios';

const router = Router();

router.post('/rpc', async (req, res) => {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to proxy Solana RPC', details: e.message });
  }
});

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

router.post('/helius/tokens', async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'Wallet address required' });

  const body = {
    jsonrpc: '2.0',
    id: '1',
    method: 'getTokenAccountsByOwner',
    params: [
      wallet,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]
  };

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // Log metadata for each token found
    if (data.result && Array.isArray(data.result.value)) {
      data.result.value.forEach((token: any) => {
        if (token.account && token.account.data && token.account.data.parsed && token.account.data.parsed.info) {
          console.log('Helius token metadata:', token.account.data.parsed.info);
        }
      });
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch tokens from Helius', details: e.message });
  }
});

// Token Metadata via Helius
router.post('/helius/token-metadata', async (req, res) => {
  try {
    const { mintAccounts } = req.body;
    if (!mintAccounts || !Array.isArray(mintAccounts)) {
      return res.status(400).json({ error: 'mintAccounts (array) is required' });
    }
    const heliusApiKey = process.env.HELIUS_API_KEY;
    if (!heliusApiKey) {
      return res.status(500).json({ error: 'Helius API key not set on server' });
    }
    const response = await axios.post(
      `https://api.helius.xyz/v0/token-metadata?api-key=${heliusApiKey}`,
      {
        mintAccounts,
        includeOffChain: true,
        disableCache: false
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Helius token-metadata response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error: any) {
    console.error('Helius token-metadata proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch token metadata', details: error.message });
  }
});

// Proxy to Moralis for SPL token price
router.get('/moralis/token-price/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Moralis API key not set on server' });
    }
    const url = `https://solana-gateway.moralis.io/token/mainnet/${mint}/price`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'X-API-Key': apiKey,
      } as any,
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Moralis error: ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router; 
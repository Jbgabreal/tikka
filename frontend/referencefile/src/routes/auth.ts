import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const nonces: Record<string, string> = {}; // In-memory store for demo

// 1. Get challenge/nonce
router.post('/challenge', (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: 'Wallet address required' });
  const nonce = Math.random().toString(36).substring(2);
  nonces[wallet] = nonce;
  res.json({ nonce });
});

// 2. Login: verify signature and issue JWT
router.post('/login', (req, res) => {
  const { wallet, signature } = req.body;
  const nonce = nonces[wallet];
  if (!wallet || !signature || !nonce) return res.status(400).json({ error: 'Missing fields' });

  try {
    const pubKey = new PublicKey(wallet);
    const msg = new TextEncoder().encode(nonce);
    const sig = Buffer.from(signature, 'base64');
    const valid = nacl.sign.detached.verify(msg, sig, pubKey.toBytes());
    if (!valid) return res.status(401).json({ error: 'Invalid signature' });

    // Issue JWT
    const token = jwt.sign({ wallet }, JWT_SECRET, { expiresIn: '1d' });
    delete nonces[wallet];
    res.json({ token });
  } catch (e) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router; 
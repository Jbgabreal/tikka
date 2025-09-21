import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Register endpoint
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const result = await AuthService.register({ email, password });
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: result.user!.id,
      email: result.user!.email,
      createdAt: result.user!.created_at
    },
    token: result.token
  });
}));

// Login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await AuthService.login({ email, password });
  
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({
    message: 'Login successful',
    user: {
      id: result.user!.id,
      email: result.user!.email,
      createdAt: result.user!.created_at
    },
    token: result.token
  });
}));

// Import wallet endpoint
router.post('/import-wallet', authMiddleware, asyncHandler(async (req, res) => {
  const { privateKey } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!privateKey) {
    return res.status(400).json({ error: 'Private key is required' });
  }

  const result = await AuthService.importWallet(userId, privateKey);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Wallet imported successfully',
    wallet: {
      id: result.wallet!.id,
      publicKey: result.wallet!.public_key,
      isImported: result.wallet!.is_imported
    }
  });
}));

// Get user wallets
router.get('/wallets', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const wallets = await AuthService.getUserWallets(userId);
  console.log('[AUTH] getUserWallets result:', JSON.stringify(wallets, null, 2));
  
  res.json({
    wallets: wallets.map(wallet => ({
      id: wallet.id,
      publicKey: wallet.publicKey,
      isImported: wallet.isImported,
      balance: wallet.balance
    }))
  });
}));

// Get user API keys
router.get('/api-keys', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const apiKeys = await AuthService.getUserApiKeys(userId);
  
  res.json({
    apiKeys: apiKeys.map(apiKey => ({
      id: apiKey.id,
      service: apiKey.service,
      createdAt: apiKey.created_at
    }))
  });
}));

// Verify token endpoint
router.get('/verify', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user!.id,
      email: req.user!.email
    }
  });
}));

export default router;

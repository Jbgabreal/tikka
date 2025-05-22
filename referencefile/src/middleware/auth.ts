import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { config } from 'dotenv';

// Load environment variables
config();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        wallet: string;
        role: string;
      };
    }
  }
}

// Authentication middleware
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { wallet: string; role: string };
    
    // Verify wallet signature if provided
    const signature = req.header('X-Wallet-Signature');
    const message = req.header('X-Wallet-Message');
    
    if (signature && message) {
      const isValid = await verifyWalletSignature(decoded.wallet, message, signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid wallet signature' });
      }
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Verify wallet signature
async function verifyWalletSignature(
  wallet: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const publicKey = new PublicKey(wallet);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return false;
  }
}

// Generate JWT token
export function generateToken(wallet: string, role: string = 'user'): string {
  return jwt.sign(
    { wallet, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// Rate limiting middleware
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const limit = 10; // requests per minute
  const window = 60; // seconds

  try {
    const key = `ratelimit:${ip}`;
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, window);
    }

    if (current > limit) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: await redisClient.ttl(key)
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Allow request if Redis is down
  }
} 
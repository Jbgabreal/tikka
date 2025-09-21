import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/UserSupabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        email?: string;
        wallet?: string;
      };
    }
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Legacy middleware for backward compatibility
const legacyAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const walletAddress = req.headers['x-wallet-address'] as string;
  
  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = { wallet: walletAddress };
  next();
};

export { authMiddleware, legacyAuthMiddleware }; 
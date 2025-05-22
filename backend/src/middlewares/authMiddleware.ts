import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        wallet: string;
      };
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const walletAddress = req.headers['x-wallet-address'] as string;
  
  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = { wallet: walletAddress };
  next();
};

export { authMiddleware }; 
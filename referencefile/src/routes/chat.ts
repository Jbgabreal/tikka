import { Router } from 'express';
import { ChatService } from '../services/chat.js';
import { checkRateLimit } from '../redis/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const chatService = new ChatService();

// Process chat message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, walletAddress } = req.body;
    
    // Rate limiting
    const ip = req.ip || 'unknown';
    const isAllowed = await checkRateLimit(ip, 10, 60); // 10 requests per minute
    if (!isAllowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Create chat context
    const context = {
      messages: [],
      walletAddress
    };

    // Process message through chat service
    const response = await chatService.processMessage(message, context);

    res.json(response);
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const history = await chatService.getChatHistory(walletAddress as string);
    res.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token creation chat endpoints
router.post('/token-creation', authMiddleware, async (req, res) => {
  try {
    const { input, walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const context = {
      messages: [],
      walletAddress
    };

    const response = await chatService.processMessage(input, context);
    res.json(response);
  } catch (error) {
    console.error('Error in token creation chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/token-creation/restart', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await chatService.clearTokenCreationSession(walletAddress);
    res.json({ message: 'Token creation flow restarted.' });
  } catch (error) {
    console.error('Error restarting token creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Swap chat endpoints
router.post('/swap', authMiddleware, async (req, res) => {
  try {
    const { input, walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const context = {
      messages: [],
      walletAddress
    };

    const response = await chatService.processMessage(input, context);
    res.json(response);
  } catch (error) {
    console.error('Error in swap chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/swap/restart', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await chatService.clearSwapSession(walletAddress);
    res.json({ message: 'Swap flow restarted.' });
  } catch (error) {
    console.error('Error restarting swap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
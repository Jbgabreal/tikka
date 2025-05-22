import { Router } from 'express';
import { ChatService } from '../services/ChatService';
import { TokenCreationService, tokenCreationSessions } from '../services/TokenCreationService';
import multer, { Multer } from 'multer';
import { Request } from 'express';

const router = Router();
const chatService = new ChatService();
const tokenCreationService = new TokenCreationService();
const upload = multer();

router.post('/message', async (req, res) => {
  const { message, context } = req.body;
  try {
    // Always check if the user is in a token creation session
    const userId = context?.walletAddress || 'default';
    const session = tokenCreationSessions[userId];
    if (
      (typeof message === 'string' && message.toLowerCase().includes('create token')) ||
      (session && session.step)
    ) {
      // Use the multi-step token creation flow
      const response = await tokenCreationService.handleCreationIntent(message, context || {});
      return res.json(response);
    }
    const response = await chatService.chatWithDeepSeek(message, context);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Chat service error', details: error?.toString() });
  }
});

router.post('/token-creation', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
  try {
    const walletAddress = req.body.walletAddress;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Token image file is required' });
    }
    // Call the new image upload handler
    const response = await tokenCreationService.handleImageUpload(req.file, { walletAddress });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Token creation image upload error', details: error?.toString() });
  }
});

export default router; 
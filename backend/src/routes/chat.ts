import { Router } from 'express';
import { ChatService } from '../services/ChatService';
import { TokenCreationService, tokenCreationSessions } from '../services/TokenCreationService';
import multer, { Multer } from 'multer';
import { Request } from 'express';
import { TokenSwapService } from '../services/TokenSwapService';

const router = Router();
const chatService = new ChatService();
const tokenCreationService = new TokenCreationService();
const tokenSwapService = new TokenSwapService();
const upload = multer();

router.post('/message', async (req, res) => {
  const { message, context } = req.body;
  try {
    console.log('[BACKEND] /api/chat/message received:', { message, context });
    const userId = context?.walletAddress || 'default';
    // If message is 'cancel' and activeFlow is set, route to the correct handler
    if (typeof message === 'string' && message.trim().toLowerCase() === 'cancel' && context?.activeFlow) {
      if (context.activeFlow === 'token-creation') {
        const response = await tokenCreationService.handleCreationIntent('cancel', context || {});
        return res.json(response);
      } else if (context.activeFlow === 'swap') {
        const response = await tokenSwapService.handleSwapIntent('cancel', context || {});
        return res.json(response);
      }
    }
    // Always check if the user is in a token creation session
    const session = tokenCreationSessions[userId];
    // Expanded intent triggers for token creation
    const createTokenIntentRegex = /\b(create( a)?( new)? token|launch( a)?( new)? token|i want to launch( a)?( new)? token|i would like to create( a)?( new)? token|launch [a-z0-9_\- ]{2,50})\b/i;
    // Expanded swap intent triggers
    const swapIntentRegex = /\b(swap|swap [a-z0-9_\- ]+ to [a-z0-9_\- ]+|swap [a-z0-9_\- ]+ for [a-z0-9_\- ]+|i want to swap( tokens?)?|i will to swap( a)?( coin| token)?|swap my tokens?|swap my coin|swap coin|swap token|i want to swap for [a-z0-9_\- ]+|i want to swap [a-z0-9_\- ]+ for [a-z0-9_\- ]+|i would like to swap( tokens?)?)\b/i;
    // Detect if user is in a swap session by currentStep
    const swapSteps = ['fromToken', 'toToken', 'amount', 'confirmation'];
    const swapSessionActive = context?.currentStep && swapSteps.includes(context.currentStep);

    if (
      (typeof message === 'string' && createTokenIntentRegex.test(message)) ||
      (session && session.step)
    ) {
      console.log('[BACKEND] Routing to: token creation');
      const response = await tokenCreationService.handleCreationIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(response);
    }
    // Swap intent or active swap session
    if ((typeof message === 'string' && swapIntentRegex.test(message)) || swapSessionActive) {
      console.log('[BACKEND] Routing to: swap');
      const response = await tokenSwapService.handleSwapIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(response);
    }
    console.log('[BACKEND] Routing to: general chat');
    const response = await chatService.chatWithDeepSeek(message, context);
    console.log('[BACKEND] Responding with:', response);
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
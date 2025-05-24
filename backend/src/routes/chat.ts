import { Router } from 'express';
import { ChatService } from '../services/ChatService';
import { TokenCreationService, tokenCreationSessions } from '../services/TokenCreationService';
import multer, { Multer } from 'multer';
import { Request } from 'express';
import { TokenSwapService } from '../services/TokenSwapService';
import trendingTokensService from '../services/trendingTokensService';
import { UserPortfolioService } from '../services/UserPortfolioService';

const router = Router();
const chatService = new ChatService();
const tokenCreationService = new TokenCreationService();
const tokenSwapService = new TokenSwapService();
const upload = multer();
const userPortfolioService = new UserPortfolioService();

// Utility to ensure { prompt: ... } structure
function ensurePromptResponse(response: any): { prompt: string } {
  if (response && typeof response === 'object' && 'prompt' in response) {
    return response;
  }
  if (typeof response === 'string') {
    return { prompt: response };
  }
  return { prompt: JSON.stringify(response) };
}

router.post('/message', async (req, res) => {
  const { message, context } = req.body;
  try {
    console.log('[BACKEND] /api/chat/message received:', { message, context });
    const userId = context?.walletAddress || 'default';
    // If message is 'cancel' and activeFlow is set, route to the correct handler
    if (typeof message === 'string' && message.trim().toLowerCase() === 'cancel' && context?.activeFlow) {
      if (context.activeFlow === 'token-creation') {
        const response = await tokenCreationService.handleCreationIntent('cancel', context || {});
        return res.json(ensurePromptResponse(response));
      } else if (context.activeFlow === 'swap') {
        const response = await tokenSwapService.handleSwapIntent('cancel', context || {});
        return res.json(ensurePromptResponse(response));
      }
    }
    // Always check if the user is in a token creation session
    const session = tokenCreationSessions[userId];
    // Expanded intent triggers for token creation
    const createTokenIntentRegex = /\b(create( a)?( new)? token|launch( a)?( new)? token|i want to launch( a)?( new)? token|i would like to create( a)?( new)? token|launch [a-z0-9_\- ]{2,50})\b/i;
    // Expanded swap intent triggers
    const swapIntentRegex = /\b(swap|swap [a-z0-9_\- ]+ to [a-z0-9_\- ]+|swap [a-z0-9_\- ]+ for [a-z0-9_\- ]+|i want to swap( tokens?)?|i will to swap( a)?( coin| token)?|swap my tokens?|swap my coin|swap coin|swap token|i want to swap for [a-z0-9_\- ]+|i want to swap [a-z0-9_\- ]+ for [a-z0-9_\- ]+|i would like to swap( tokens?)?)\b/i;
    // Trending tokens intent regex
    const trendingTokensIntentRegex = /(trending token|top tokens|best token|top 10 trending token|top 10 token|top trending|top \d+ tokens|top \d+ trending|top \d+ best|top \d+ coin|top \d+)/i;
    // Portfolio intent regex
    const portfolioIntentRegex = /(my portfolio|show my portfolio|wallet tokens|my tokens|portfolio balance|my solana portfolio)/i;
    // Detect if user is in a swap session by currentStep
    const swapSteps = ['fromToken', 'toToken', 'amount', 'confirmation'];
    const swapSessionActive = context?.currentStep && swapSteps.includes(context.currentStep);

    // Only start a flow if the message matches the intent
    if (typeof message === 'string' && createTokenIntentRegex.test(message)) {
      console.log('[BACKEND] Routing to: token creation (intent match)');
      const response = await tokenCreationService.handleCreationIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(ensurePromptResponse(response));
    }
    if (typeof message === 'string' && swapIntentRegex.test(message)) {
      console.log('[BACKEND] Routing to: swap (intent match)');
      const response = await tokenSwapService.handleSwapIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(ensurePromptResponse(response));
    }
    if (typeof message === 'string' && trendingTokensIntentRegex.test(message)) {
      console.log('[BACKEND] Routing to: trending tokens (intent match)');
      // Extract top N if present
      const topMatch = message.match(/top (\d+)/i);
      let topN = 10;
      if (topMatch && topMatch[1]) {
        topN = parseInt(topMatch[1], 10);
      } else if (/top 5/i.test(message)) {
        topN = 5;
      }
      // Use the same service as /api/trending-tokens
      let tokens = await trendingTokensService.getTrendingTokensWithDetails();
      tokens = tokens
        .filter(t => t.price && t.price > 0)
        .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        .slice(0, topN);
      // Return the array of token objects directly for frontend rendering
      return res.json({ prompt: tokens });
    }
    if (typeof message === 'string' && portfolioIntentRegex.test(message)) {
      console.log('[BACKEND] Routing to: user portfolio (intent match)');
      const walletAddress = context?.walletAddress;
      if (!walletAddress) {
        return res.json(ensurePromptResponse('Please connect your wallet to view your portfolio.'));
      }
      try {
        const tokens = await userPortfolioService.getUserPortfolioWithMetadata(walletAddress);
        if (!tokens.length) {
          return res.json(ensurePromptResponse('No tokens found in your wallet.'));
        }
        return res.json({ prompt: tokens });
      } catch (e) {
        return res.json(ensurePromptResponse('Failed to fetch your portfolio.'));
      }
    }

    // If a session is already active, continue the flow
    if (session && session.step) {
      console.log('[BACKEND] Routing to: token creation (session active)');
      const response = await tokenCreationService.handleCreationIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(ensurePromptResponse(response));
    }
    if (swapSessionActive) {
      console.log('[BACKEND] Routing to: swap (session active)');
      const response = await tokenSwapService.handleSwapIntent(message, context || {});
      console.log('[BACKEND] Responding with:', response);
      return res.json(ensurePromptResponse(response));
    }

    // Otherwise, route to general chat
    console.log('[BACKEND] Routing to: general chat');
    const response = await chatService.chatWithDeepSeek(message, context);
    console.log('[BACKEND] Responding with:', response);
    res.json(ensurePromptResponse(response));
  } catch (error) {
    res.status(500).json({ prompt: 'Chat service error', details: error?.toString() });
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
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  executeTrade,
  createToken,
  getTokenPrice,
  getTokenLiquidity,
  getTokenHolders,
  saveUserToken
} from '../services/pumpportal.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { setTokenCreationSession, getTokenCreationSession, clearTokenCreationSession } from '../redis/index.js';
import { uploadImageToIPFS, uploadMetadataToIPFS } from '../lib/pinata.js';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { setSwapSession, getSwapSession, clearSwapSession } from '../redis/index.js';
import { getSymbolByMintAddress, getTokenNameByMint, initializeTokenMetadata } from '../services/raydium.js';
import { authMiddleware } from '../middleware/auth.js';
import { getTrendingTokens } from '../services/token.js';
import { getMoralisTrendingWithDbComparison } from '../services/tokenPrice.js';
import { ServiceFactory } from '../services/core/ServiceFactory.js';
import { checkRateLimit } from '../redis/index.js';

// Fix TokenCreationSession type
type TokenCreationSession = {
  step: string | null;
  image?: string;
  name?: string;
  symbol?: string;
  amount?: number;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  validationErrorCount?: number;
  awaitingConfirmation?: boolean;
  [key: string]: any; // Allow dynamic step assignment
};

// Update TokenCreationRequest interface to include quick-create body fields
interface TokenCreationRequest extends Request {
  file?: Express.Multer.File;
  user?: {
    wallet: string;
    role: string;
  };
  body: {
    input?: string;
    name?: string;
    symbol?: string;
    description?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    amount?: string;
  };
}

// Add type for swap session
interface SwapSession {
  step: string | null;
  fromToken?: string;
  toToken?: string;
  amount?: number;
  [key: string]: any; // Allow string index for dynamic step assignment
  validationErrorCount?: number;
  awaitingConfirmation?: boolean;
}

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const upload = multer();

// Schema for trade request
const tradeSchema = z.object({
  action: z.enum(['buy', 'sell']),
  mint: z.string(),
  amount: z.number().positive(),
  denominatedInSol: z.boolean(),
  slippage: z.number().min(0).max(100),
  priorityFee: z.number().min(0),
  pool: z.enum(['pump', 'raydium', 'pump-amm', 'auto']).optional(),
  skipPreflight: z.boolean().optional(),
  jitoOnly: z.boolean().optional()
});

// Schema for token creation
const tokenCreationSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10),
  decimals: z.number().int().min(0).max(9),
  totalSupply: z.number().positive(),
  initialLiquidity: z.number().positive()
});

// Steps for token creation
const TOKEN_CREATION_STEPS = [
  'image',
  'name',
  'symbol',
  'description',
  'twitter',
  'telegram',
  'website',
  'amount'
];

// Steps for swap
const SWAP_STEPS = ['fromToken', 'toToken', 'amount'];

// Helper to get next step
function getNextStep(currentStep: string | null) {
  if (!currentStep) return TOKEN_CREATION_STEPS[0];
  const idx = TOKEN_CREATION_STEPS.indexOf(currentStep);
  return TOKEN_CREATION_STEPS[idx + 1] || null;
}

// Helper: validate input for each step
function validateStepInput(step: string, input: any): string | null {
  switch (step) {
    case 'image':
      if (!input || typeof input !== 'string') return 'Image upload failed.';
      if (!input.endsWith('.png') && !input.endsWith('.jpg') && !input.endsWith('.jpeg')) return 'Only PNG/JPG images are allowed.';
      return null;
    case 'name':
      if (!input || input.length < 2 || input.length > 50) return 'Name must be 2-50 characters.';
      return null;
    case 'symbol':
      if (!/^[A-Z0-9]{2,10}$/.test(input)) return 'Symbol must be 2-10 uppercase letters or numbers.';
      return null;
    case 'amount':
      if (input === undefined || isNaN(Number(input)) || Number(input) < 0) return 'Amount must be zero or a positive number.';
      return null;
    case 'description':
      if (!input || input.length < 5) return 'Description is too short.';
      return null;
    case 'twitter':
    case 'telegram':
    case 'website':
      if (input && !/^https?:\/\//.test(input)) return 'Must be a valid URL.';
      return null;
    default:
      return null;
  }
}

// Helper: get previous step
function getPreviousStep(currentStep: string | null) {
  if (!currentStep) return null;
  const idx = TOKEN_CREATION_STEPS.indexOf(currentStep);
  return idx > 0 ? TOKEN_CREATION_STEPS[idx - 1] : null;
}

// Helper to get next swap step
function getNextSwapStep(currentStep: string | null) {
  if (!currentStep) return SWAP_STEPS[0];
  const idx = SWAP_STEPS.indexOf(currentStep);
  return SWAP_STEPS[idx + 1] || null;
}

function validateSwapStepInput(step: string, input: any): string | null {
  switch (step) {
    case 'fromToken':
    case 'toToken':
      if (!input || typeof input !== 'string' || input.length < 2) return 'Please provide a valid token symbol or mint address.';
      return null;
    case 'amount':
      if (input === undefined || isNaN(Number(input)) || Number(input) <= 0) return 'Amount must be a positive number.';
      return null;
    default:
      return null;
  }
}

/**
 * @route POST /api/tokens/trade
 * @desc Execute a token trade
 * @access Private
 */
router.post('/trade',
  validateRequest({ body: tradeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeTrade(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/tokens/create
 * @desc Create a new token
 * @access Private
 */
router.post('/create', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    
    // Rate limiting
    const ip = req.ip || 'unknown';
    const isAllowed = await checkRateLimit(ip, 5, 300); // 5 requests per 5 minutes
    if (!isAllowed) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Token image is required' });
    }

    const tokenService = serviceFactory.getTokenService();
    const response = await tokenService.handleFileUpload(req.file, walletAddress);

    res.json({ response });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/tokens/:mint/price
 * @desc Get token price
 * @access Public
 */
router.get('/:mint/price',
  asyncHandler(async (req: Request, res: Response) => {
    const price = await getTokenPrice(req.params.mint);
    res.json({ price });
  })
);

/**
 * @route GET /api/tokens/:mint/liquidity
 * @desc Get token liquidity
 * @access Public
 */
router.get('/:mint/liquidity',
  asyncHandler(async (req: Request, res: Response) => {
    const liquidity = await getTokenLiquidity(req.params.mint);
    res.json(liquidity);
  })
);

/**
 * @route GET /api/tokens/:mint/holders
 * @desc Get token holders
 * @access Public
 */
router.get('/:mint/holders',
  asyncHandler(async (req: Request, res: Response) => {
    const holders = await getTokenHolders(req.params.mint);
    res.json({ holders });
  })
);

/**
 * @route POST /api/chat/token-creation
 * @desc Multi-step token creation via chat (text or file)
 * @access Private
 */
router.post('/chat/token-creation', authMiddleware, upload.single('file'), asyncHandler(async (req: TokenCreationRequest, res: Response) => {
  console.log('Token creation request received:', {
    hasFile: !!req.file,
    fileDetails: req.file ? {
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null,
    body: req.body,
  });

  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  let session = (await getTokenCreationSession(userId)) as TokenCreationSession || { step: null };
  let { step } = session;

  // --- HANDLE CONFIRMATION FIRST ---
  if (session.awaitingConfirmation) {
    const userInput = req.body.input?.trim().toLowerCase();
    const summary =
      `📝 **Token Creation Summary**\n` +
      `-----------------------------\n` +
      `**Name:** ${session.name || '-'}\n` +
      `**Symbol:** ${session.symbol || '-'}\n` +
      `**Description:** ${session.description || '-'}\n` +
      `**Twitter:** ${session.twitter || '-'}\n` +
      `**Telegram:** ${session.telegram || '-'}\n` +
      `**Website:** ${session.website || '-'}\n` +
      `**Amount:** ${session.amount || '-'}\n` +
      `-----------------------------\n` +
      `\nReply 'proceed' to create the token, or 'abort'/'cancel' to stop.`;
    if (userInput === 'proceed') {
      session.awaitingConfirmation = false;
      session.step = null;
      await setTokenCreationSession(userId, session);
      // All fields collected: upload metadata to IPFS and create token
      try {
        const metadata = {
          name: session.name,
          symbol: session.symbol,
          description: session.description,
          twitter: session.twitter,
          telegram: session.telegram,
          website: session.website,
          image: session.image,
          showName: 'true'
        };
        let metadataUri;
        try {
          metadataUri = await uploadMetadataToIPFS(metadata);
        } catch (e) {
          return res.status(500).json({ error: 'Failed to upload metadata to IPFS' });
        }
        // Generate a new mint keypair
        const mintKeypair = Keypair.generate();
        // Call PumpPortal to create token
        const pumpRequestBody = {
          publicKey: userId,
          action: 'create',
          tokenMetadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadataUri
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: 'true',
          amount: session.amount ?? 0,
          slippage: 10,
          priorityFee: 0.0005,
          pool: 'pump',
          skipLiquidity: session.amount === 0
        };
        console.log('PumpPortal create request:', JSON.stringify(pumpRequestBody, null, 2));
        const createRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pumpRequestBody)
        });
        const contentType = createRes.headers.get('content-type');
        const buffer = await createRes.arrayBuffer();

        if (contentType && contentType.includes('application/json')) {
          const text = Buffer.from(buffer).toString('utf-8');
          let createJson;
          try {
            createJson = JSON.parse(text);
          } catch (e) {
            return res.status(500).json({ error: 'Token creation failed', details: text });
          }
          // Handle JSON response (error or success)
          if (createJson.error) {
            return res.status(500).json({ error: 'Token creation failed', details: createJson.error });
          }
          // Save token to user_tokens table
          await saveUserToken(userId, {
            mint: createJson.mint,
            name: metadata.name!,
            symbol: metadata.symbol!,
            image: metadata.image!
          });
          await clearTokenCreationSession(userId);
          return res.json({
            message: 'Token created successfully!',
            mint: createJson.mint,
            transaction: createJson.transaction,
            explorer: `https://solscan.io/tx/${createJson.transaction}`
          });
        }
        // Not JSON: likely a transaction (Buffer)
        console.log('PumpPortal returned non-JSON response (likely a transaction)');
        const transactionBase64 = Buffer.from(buffer).toString('base64');
        // Instead of signing and sending, return the unsigned transaction to the frontend
        return res.status(200).json({
          message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
          unsignedTransaction: transactionBase64,
          mint: mintKeypair.publicKey.toBase58(),
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'Token creation failed', details: errorMsg });
      }
    } else if (userInput === 'abort' || userInput === 'cancel') {
      await clearTokenCreationSession(userId);
      return res.json({ message: 'Token creation aborted.' });
    } else {
      return res.json({ prompt: summary, step: 'confirmation' });
    }
  }

  // --- Restart logic: if this is an image upload and session is not at image step, clear session ---
  if (req.file && step && step !== 'image') {
    // User is uploading an image but session is stuck at a later step (like amount), so restart
    await clearTokenCreationSession(userId);
    session = { step: null };
    step = 'image';
    console.log('Session was out of sync, restarting token creation flow at image step.');
  }
  if (!step) step = 'image';

  // Handle 'back' and 'edit <field>' commands
  const userInput = req.body.input?.trim().toLowerCase();
  if (userInput === 'back') {
    const prevStep = getPreviousStep(step);
    if (!prevStep) return res.json({ prompt: 'Already at the first step.', step });
    session.step = prevStep;
    await setTokenCreationSession(userId, session);
    return res.json({ prompt: `Going back. Please provide ${prevStep}.`, step: prevStep });
  }
  if (userInput && userInput.startsWith('edit ')) {
    const editField = userInput.split(' ')[1];
    if (!TOKEN_CREATION_STEPS.includes(editField)) return res.json({ prompt: 'Unknown field to edit.', step });
    session.step = editField;
    await setTokenCreationSession(userId, session);
    return res.json({ prompt: `Editing ${editField}. Please provide a new value.`, step: editField });
  }

  // Handle input for current step
  let input;
  if (step === 'image' && req.file) {
    try {
      const imageUrl = await uploadImageToIPFS(req.file);
      session.image = imageUrl;
      input = imageUrl;
      
      // Move to next step after successful image upload
      const nextStep = TOKEN_CREATION_STEPS[TOKEN_CREATION_STEPS.indexOf('image') + 1];
      session.step = nextStep;
      await setTokenCreationSession(userId, session);
      
      return res.json({ 
        prompt: `Great! I've saved your token image. Now, please provide a name for your token.`,
        step: nextStep,
        imageUrl 
      });
    } catch (e) {
      console.error('Failed to upload image to IPFS:', e);
      return res.status(500).json({ error: 'Failed to upload image to IPFS' });
    }
  } else if (step !== 'image' && req.body.input) {
    if (step === 'symbol') {
      // Always uppercase and trim symbol input before validation
      const symbolInput = req.body.input.trim().toUpperCase();
      session[step] = symbolInput;
      input = symbolInput;
    } else if (step === 'amount') {
      session[step] = Number(req.body.input);
      input = Number(req.body.input);
    } else if (["twitter", "telegram", "website"].includes(step) && req.body.input && req.body.input.trim().toLowerCase() === "skip") {
      session[step] = '';
      input = '';
    } else {
      session[step] = req.body.input;
      input = req.body.input;
    }
  } else {
    return res.status(400).json({ error: 'Missing input for step: ' + step, step });
  }

  // Validate input
  const validationError = validateStepInput(step, input);
  if (validationError) {
    session.validationErrorCount = (session.validationErrorCount || 0) + 1;
    await setTokenCreationSession(userId, session);
    if (session.validationErrorCount >= 3) {
      await clearTokenCreationSession(userId);
      return res.json({
        prompt: "Token creation cancelled due to repeated invalid input. Please start again if you wish to create a token.",
        step: null,
        cancelled: true
      });
    }
    return res.status(400).json({ error: validationError, step });
  }

  // On valid input, reset error count:
  session.validationErrorCount = 0;

  // Advance to next step
  const nextStep = getNextStep(step);
  session.step = nextStep;
  await setTokenCreationSession(userId, session);

  // If not done, prompt for next field
  if (nextStep) {
    let prompt = '';
    switch (nextStep) {
      case 'image': prompt = 'Please upload an image for your token.'; break;
      case 'name': prompt = 'What is the name of your token?'; break;
      case 'symbol': prompt = 'What is the symbol? (2-10 uppercase letters or numbers)'; break;
      case 'amount': prompt = 'How many tokens would you like to buy (amount)?'; break;
      case 'description': prompt = 'Please provide a description.'; break;
      case 'twitter': prompt = 'Twitter link? (must be a valid URL, or type "skip" to leave blank)'; break;
      case 'telegram': prompt = 'Telegram link? (must be a valid URL, or type "skip" to leave blank)'; break;
      case 'website': prompt = 'Website? (must be a valid URL, or type "skip" to leave blank)'; break;
    }
    return res.json({ prompt, step: nextStep });
  }

  // --- TOKEN CREATION FINAL CONFIRMATION ---
  if (!nextStep) {
    // Check for missing required fields before showing confirmation
    const requiredFields = ['image', 'name', 'symbol', 'amount'];
    for (const field of requiredFields) {
      if (session[field] === undefined || session[field] === null) {
        session.step = field;
        await setTokenCreationSession(userId, session);
        return res.status(400).json({ error: `Missing input for step: ${field}`, step: field });
      }
    }
    if (!session.awaitingConfirmation) {
      session.awaitingConfirmation = true;
      await setTokenCreationSession(userId, session);
      // Always show the summary again until user replies 'proceed' or 'abort'
      const summary =
        `📝 **Token Creation Summary**\n` +
        `-----------------------------\n` +
        `**Name:** ${session.name || '-'}\n` +
        `**Symbol:** ${session.symbol || '-'}\n` +
        `**Description:** ${session.description || '-'}\n` +
        `**Twitter:** ${session.twitter || '-'}\n` +
        `**Telegram:** ${session.telegram || '-'}\n` +
        `**Website:** ${session.website || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nReply 'proceed' to create the token, or 'abort'/'cancel' to stop.`;
      return res.json({ prompt: summary, step: 'confirmation' });
    }
    // Handle confirmation input
    const userInput = req.body.input?.trim().toLowerCase();
    if (userInput === 'proceed') {
      session.awaitingConfirmation = false;
      session.step = null;
      await setTokenCreationSession(userId, session);
      // All fields collected: upload metadata to IPFS and create token
      try {
        const metadata = {
          name: session.name,
          symbol: session.symbol,
          description: session.description,
          twitter: session.twitter,
          telegram: session.telegram,
          website: session.website,
          image: session.image,
          showName: 'true'
        };
        let metadataUri;
        try {
          metadataUri = await uploadMetadataToIPFS(metadata);
        } catch (e) {
          return res.status(500).json({ error: 'Failed to upload metadata to IPFS' });
        }
        // Generate a new mint keypair
        const mintKeypair = Keypair.generate();
        // Call PumpPortal to create token
        const pumpRequestBody = {
          publicKey: userId,
          action: 'create',
          tokenMetadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadataUri
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: 'true',
          amount: session.amount ?? 0,
          slippage: 10,
          priorityFee: 0.0005,
          pool: 'pump',
          skipLiquidity: session.amount === 0
        };
        console.log('PumpPortal create request:', JSON.stringify(pumpRequestBody, null, 2));
        const createRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pumpRequestBody)
        });
        const contentType = createRes.headers.get('content-type');
        const buffer = await createRes.arrayBuffer();

        if (contentType && contentType.includes('application/json')) {
          const text = Buffer.from(buffer).toString('utf-8');
          let createJson;
          try {
            createJson = JSON.parse(text);
          } catch (e) {
            return res.status(500).json({ error: 'Token creation failed', details: text });
          }
          // Handle JSON response (error or success)
          if (createJson.error) {
            return res.status(500).json({ error: 'Token creation failed', details: createJson.error });
          }
          // Save token to user_tokens table
          await saveUserToken(userId, {
            mint: createJson.mint,
            name: metadata.name!,
            symbol: metadata.symbol!,
            image: metadata.image!
          });
          await clearTokenCreationSession(userId);
          return res.json({
            message: 'Token created successfully!',
            mint: createJson.mint,
            transaction: createJson.transaction,
            explorer: `https://solscan.io/tx/${createJson.transaction}`
          });
        }
        // Not JSON: likely a transaction (Buffer)
        console.log('PumpPortal returned non-JSON response (likely a transaction)');
        const transactionBase64 = Buffer.from(buffer).toString('base64');
        // Instead of signing and sending, return the unsigned transaction to the frontend
        return res.status(200).json({
          message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
          unsignedTransaction: transactionBase64,
          mint: mintKeypair.publicKey.toBase58(),
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'Token creation failed', details: errorMsg });
      }
    } else if (userInput === 'abort' || userInput === 'cancel') {
      await clearTokenCreationSession(userId);
      return res.json({ message: 'Token creation aborted.' });
    } else {
      // Always show the summary again until user replies 'proceed' or 'abort'
      const summary =
        `📝 **Token Creation Summary**\n` +
        `-----------------------------\n` +
        `**Name:** ${session.name || '-'}\n` +
        `**Symbol:** ${session.symbol || '-'}\n` +
        `**Description:** ${session.description || '-'}\n` +
        `**Twitter:** ${session.twitter || '-'}\n` +
        `**Telegram:** ${session.telegram || '-'}\n` +
        `**Website:** ${session.website || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nReply 'proceed' to create the token, or 'abort'/'cancel' to stop.`;
      return res.json({ prompt: summary, step: 'confirmation' });
    }
  }
}));

/**
 * @route POST /api/tokens/chat/token-creation/restart
 * @desc Restart the token creation flow (clear session)
 * @access Private
 */
router.post('/chat/token-creation/restart', asyncHandler(async (req: TokenCreationRequest, res: Response) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  await clearTokenCreationSession(userId);
  res.json({ message: 'Token creation flow restarted.' });
}));

// Fetch all tokens for the authenticated user
router.get('/user/tokens', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  const result = await (await import('../database/index.js')).query(
    'SELECT mint, name, symbol, image, enabled, created_at FROM user_tokens WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json({ tokens: result.rows });
}));

// Toggle enabled/disabled state for a token
router.post('/user/tokens/:mint/toggle', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.wallet;
  const { mint } = req.params;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  // Toggle the enabled state
  const result = await (await import('../database/index.js')).query(
    'UPDATE user_tokens SET enabled = NOT enabled WHERE user_id = $1 AND mint = $2 RETURNING mint, enabled',
    [userId, mint]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Token not found' });
  res.json({ mint: result.rows[0].mint, enabled: result.rows[0].enabled });
}));

/**
 * @route POST /api/tokens/chat/swap
 * @desc Multi-step swap via chat
 * @access Private
 */
router.post('/chat/swap', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  let session = (await getSwapSession(userId)) as SwapSession || { step: null };
  let { step } = session;

  // Step-by-step chat swap logic
  const SWAP_STEPS = ['fromToken', 'toToken', 'amount'];
  let nextStep = SWAP_STEPS.find((s) => !session[s]);

  const userInput = req.body.input?.trim();
  // If this is the very first step and user provided input, treat it as fromToken
  if (!step && nextStep === 'fromToken' && userInput) {
    const error = validateSwapStepInput('fromToken', userInput);
    if (error) {
      return res.json({ error, step: 'fromToken' });
    }
    session.fromToken = userInput;
    session.step = 'toToken';
    await setSwapSession(userId, session);
    return res.json({ prompt: 'Which token do you want to swap to? (symbol or mint address)', step: 'toToken' });
  }
  if (nextStep) {
    if (step) {
      // Validate the input for the current step
      const error = validateSwapStepInput(step, userInput);
      if (error) {
        return res.json({ error, step });
      }
      // Save the input to the session
      session[step] = userInput;
      await setSwapSession(userId, session);
      // Move to the next step
      nextStep = SWAP_STEPS.find((s) => !session[s]);
    }
    // Prompt for the next step
    if (nextStep) {
      session.step = nextStep;
      await setSwapSession(userId, session);
      let prompt = '';
      if (nextStep === 'fromToken') prompt = 'Which token do you want to swap from? (symbol or mint address)';
      if (nextStep === 'toToken') prompt = 'Which token do you want to swap to? (symbol or mint address)';
      if (nextStep === 'amount') prompt = 'How much do you want to swap?';
      return res.json({ prompt, step: nextStep });
    }
    // If all steps are filled, move to confirmation
    session.step = null;
    await setSwapSession(userId, session);
    // Immediately show confirmation summary if all steps are filled
    if (!SWAP_STEPS.find((s) => !session[s])) {
      session.awaitingConfirmation = true;
      await setSwapSession(userId, session);
      const summary = `🔄 **Swap Summary**\n` +
        `-----------------------------\n` +
        `**From:** ${session.fromToken || '-'}\n` +
        `**To:** ${session.toToken || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nReply 'proceed' to perform the swap, or 'abort'/'cancel' to stop.`;
      return res.json({ prompt: summary, step: 'confirmation' });
    }
  }

  // --- HANDLE CONFIRMATION FIRST ---
  if (session.awaitingConfirmation) {
    const userInput = req.body.input?.trim().toLowerCase();
    const summary =
      `🔄 **Swap Summary**\n` +
      `-----------------------------\n` +
      `**From:** ${session.fromToken || '-'}\n` +
      `**To:** ${session.toToken || '-'}\n` +
      `**Amount:** ${session.amount || '-'}\n` +
      `-----------------------------\n` +
      `\nReply 'proceed' to perform the swap, or 'abort'/'cancel' to stop.`;
    if (userInput === 'proceed') {
      session.awaitingConfirmation = false;
      session.step = null;
      await setSwapSession(userId, session);
      // All info collected, call PumpPortal API
      try {
        // Determine action and params
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        let action, mint, denominatedInSol, amount;
        if (session.fromToken === SOL_MINT) {
          // Swapping SOL to token (buy)
          action = 'buy';
          mint = session.toToken;
          denominatedInSol = true;
          amount = session.amount;
        } else if (session.toToken === SOL_MINT) {
          // Swapping token to SOL (sell)
          action = 'sell';
          mint = session.fromToken;
          denominatedInSol = false;
          amount = session.amount;
        } else {
          // Only support SOL <-> token swaps for now
          return res.status(400).json({ error: 'Only SOL <-> token swaps are supported at this time.' });
        }
        const swapRequest = {
          publicKey: userId,
          action,
          mint,
          denominatedInSol: denominatedInSol.toString(),
          amount,
          slippage: 0.5,
          priorityFee: 0,
          pool: 'auto',
        };
        // LOG the request to PumpPortal
        console.log('PumpPortal SWAP REQUEST:', JSON.stringify(swapRequest, null, 2));
        // Call PumpPortal API
        const pumpRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(swapRequest)
        });
        const contentType = pumpRes.headers.get('content-type');
        const buffer = await pumpRes.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');
        // LOG the response from PumpPortal
        console.log('PumpPortal SWAP RESPONSE:', pumpRes.status, pumpRes.statusText, contentType, text);
        if (contentType && contentType.includes('application/json')) {
          let pumpJson;
          try {
            pumpJson = JSON.parse(text);
          } catch (e: any) {
            return res.status(500).json({ error: 'Swap failed', details: text });
          }
          if (pumpJson.error) {
            return res.status(500).json({ error: 'Swap failed', details: pumpJson.error });
          }
          await clearSwapSession(userId);
          return res.json({
            message: 'Swap transaction created. Please sign and submit.',
            unsignedTx: pumpJson.unsignedTx,
            swapDetails: swapRequest
          });
        } else {
          // Assume it's a transaction buffer
          const transactionBase64 = Buffer.from(buffer).toString('base64');
          await clearSwapSession(userId);
          return res.status(200).json({
            message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
            unsignedTransaction: transactionBase64,
            swapDetails: swapRequest,
          });
        }
      } catch (e: any) {
        return res.status(500).json({ error: 'Swap failed', details: e.message });
      }
    } else if (userInput === 'abort' || userInput === 'cancel') {
      await clearSwapSession(userId);
      return res.json({ message: 'Swap aborted.' });
    } else {
      return res.json({ prompt: summary, step: 'confirmation' });
    }
  }

  // --- SWAP FINAL CONFIRMATION ---
  // After all swap info is collected, before performing the swap:
  if (!step) {
    if (!session.awaitingConfirmation) {
      session.awaitingConfirmation = true;
      await setSwapSession(userId, session);
      // Compose summary (only show this one)
      const summary = `🔄 **Swap Summary**\n` +
        `-----------------------------\n` +
        `**From:** ${session.fromToken || '-'}\n` +
        `**To:** ${session.toToken || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nReply 'proceed' to perform the swap, or 'abort'/'cancel' to stop.`;
      return res.json({ prompt: summary, step: 'confirmation' });
    }
    // Handle confirmation input
    const userInput = req.body.input?.trim().toLowerCase();
    if (userInput === 'proceed') {
      session.awaitingConfirmation = false;
      await setSwapSession(userId, session);
      // All info collected, call PumpPortal API
      try {
        // Determine action and params
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        let action, mint, denominatedInSol, amount;
        if (session.fromToken === SOL_MINT) {
          // Swapping SOL to token (buy)
          action = 'buy';
          mint = session.toToken;
          denominatedInSol = true;
          amount = session.amount;
        } else if (session.toToken === SOL_MINT) {
          // Swapping token to SOL (sell)
          action = 'sell';
          mint = session.fromToken;
          denominatedInSol = false;
          amount = session.amount;
        } else {
          // Only support SOL <-> token swaps for now
          return res.status(400).json({ error: 'Only SOL <-> token swaps are supported at this time.' });
        }
        const swapRequest = {
          publicKey: userId,
          action,
          mint,
          denominatedInSol: denominatedInSol.toString(),
          amount,
          slippage: 0.5,
          priorityFee: 0,
          pool: 'auto',
        };
        // LOG the request to PumpPortal
        console.log('PumpPortal SWAP REQUEST:', JSON.stringify(swapRequest, null, 2));
        // Call PumpPortal API
        const pumpRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(swapRequest)
        });
        const contentType = pumpRes.headers.get('content-type');
        const buffer = await pumpRes.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');
        // LOG the response from PumpPortal
        console.log('PumpPortal SWAP RESPONSE:', pumpRes.status, pumpRes.statusText, contentType, text);
        if (contentType && contentType.includes('application/json')) {
          let pumpJson;
          try {
            pumpJson = JSON.parse(text);
          } catch (e: any) {
            return res.status(500).json({ error: 'Swap failed', details: text });
          }
          if (pumpJson.error) {
            return res.status(500).json({ error: 'Swap failed', details: pumpJson.error });
          }
          await clearSwapSession(userId);
          return res.json({
            message: 'Swap transaction created. Please sign and submit.',
            unsignedTx: pumpJson.unsignedTx,
            swapDetails: swapRequest
          });
        } else {
          // Assume it's a transaction buffer
          const transactionBase64 = Buffer.from(buffer).toString('base64');
          await clearSwapSession(userId);
          return res.status(200).json({
            message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
            unsignedTransaction: transactionBase64,
            swapDetails: swapRequest,
          });
        }
      } catch (e: any) {
        return res.status(500).json({ error: 'Swap failed', details: e.message });
      }
    } else if (userInput === 'abort' || userInput === 'cancel') {
      await clearSwapSession(userId);
      return res.json({ message: 'Swap aborted.' });
    } else {
      // Always show the summary again until user replies 'proceed' or 'abort'
      const summary = `🔄 **Swap Summary**\n` +
        `-----------------------------\n` +
        `**From:** ${session.fromToken || '-'}\n` +
        `**To:** ${session.toToken || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nReply 'proceed' to perform the swap, or 'abort'/'cancel' to stop.`;
      return res.json({ prompt: summary, step: 'confirmation' });
    }
  }
}));

/**
 * @route POST /api/tokens/chat/swap/restart
 * @desc Restart the swap flow (clear session)
 * @access Private
 */
router.post('/chat/swap/restart', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  await clearSwapSession(userId);
  res.json({ message: 'Swap flow restarted.' });
}));

// Get token metadata (name, symbol, logo_uri) by mint
router.get('/metadata/:mint', asyncHandler(async (req: Request, res: Response) => {
  const { mint } = req.params;
  // Validate Solana address (base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  // 1. Try DB first
  const result = await (await import('../database/index.js')).query('SELECT name, symbol, logo_uri FROM token_metadata WHERE address = $1', [mint]);
  if (result.rows.length > 0) {
    return res.json(result.rows[0]);
  }
  // 2. Try Helius token-metadata endpoint
  const heliusApiKey = process.env.HELIUS_API_KEY;
  if (heliusApiKey) {
    try {
      const response = await (await import('axios')).default.post(
        `https://api.helius.xyz/v0/token-metadata?api-key=${heliusApiKey}`,
        { mintAccounts: [mint], includeOffChain: true, disableCache: false },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data && response.data.length > 0) {
        const meta = response.data[0];
        const name = meta.onChainMetadata?.metadata?.data?.name || meta.offChainMetadata?.metadata?.name;
        const symbol = meta.onChainMetadata?.metadata?.data?.symbol || meta.offChainMetadata?.metadata?.symbol;
        const logo_uri = meta.offChainMetadata?.metadata?.image;
        if (name || symbol) {
          try {
            await (await import('../database/index.js')).query(
              'INSERT INTO token_metadata (address, name, symbol, logo_uri) VALUES ($1, $2, $3, $4) ON CONFLICT (address) DO NOTHING',
              [mint, name, symbol, logo_uri]
            );
          } catch (err) {
            console.error('Failed to insert token metadata from Helius:', err);
          }
          return res.json({ name, symbol, logo_uri });
        }
      }
    } catch (err) {
      console.error('Helius token-metadata error:', err);
    }
  }
  // 3. Fallback: use Raydium in-memory logic
  await initializeTokenMetadata();
  const symbol = getSymbolByMintAddress(mint);
  const name = getTokenNameByMint(mint);
  let logo_uri = null;
  if (!symbol && !name) {
    console.error(`Token metadata not found for mint: ${mint}`);
    return res.status(404).json({ error: 'Token metadata not found' });
  }
  try {
    await (await import('../database/index.js')).query(
      'INSERT INTO token_metadata (address, name, symbol, logo_uri) VALUES ($1, $2, $3, $4) ON CONFLICT (address) DO NOTHING',
      [mint, name, symbol, logo_uri]
    );
  } catch (err) {
    console.error('Failed to insert token metadata from Raydium:', err);
  }
  return res.json({ name, symbol, logo_uri });
}));

// Single-step quick swap endpoint for dashboard/quick actions
router.post('/quick-swap', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  const { fromToken, toToken, amount, slippage = 0.5, priorityFee = 0, pool = 'auto' } = req.body;
  if (!fromToken || !toToken || !amount) {
    return res.status(400).json({ error: 'Missing required swap parameters' });
  }
  // Determine action and params
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  let action, mint, denominatedInSol;
  if (fromToken === SOL_MINT) {
    action = 'buy';
    mint = toToken;
    denominatedInSol = true;
  } else if (toToken === SOL_MINT) {
    action = 'sell';
    mint = fromToken;
    denominatedInSol = false;
  } else {
    return res.status(400).json({ error: 'Only SOL <-> token swaps are supported at this time.' });
  }
  const swapRequest = {
    publicKey: userId,
    action,
    mint,
    denominatedInSol: denominatedInSol.toString(),
    amount,
    slippage,
    priorityFee,
    pool,
  };
  try {
    // Call PumpPortal
    const pumpRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest)
    });
    const contentType = pumpRes.headers.get('content-type');
    const buffer = await pumpRes.arrayBuffer();
    const text = Buffer.from(buffer).toString('utf-8');
    if (contentType && contentType.includes('application/json')) {
      let pumpJson;
      try { pumpJson = JSON.parse(text); } catch (e) { return res.status(500).json({ error: 'Swap failed', details: text }); }
      if (pumpJson.error) {
        return res.status(500).json({ error: 'Swap failed', details: pumpJson.error });
      }
      // Optionally, estimate receive value (not required)
      let receiveValue = null;
      try {
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
        const prices = await priceRes.json();
        if (prices.solana && prices.solana.usd && toToken === SOL_MINT) {
          receiveValue = amount * prices.solana.usd;
        }
      } catch (e) {}
      return res.json({
        message: 'Swap transaction created. Please sign and submit.',
        unsignedTx: pumpJson.unsignedTx,
        swapDetails: { fromToken, toToken, amount, slippage, priorityFee, pool, receiveValue }
      });
    } else {
      // Assume it's a transaction buffer
      const transactionBase64 = Buffer.from(buffer).toString('base64');
      return res.status(200).json({
        message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
        unsignedTransaction: transactionBase64,
        swapDetails: { fromToken, toToken, amount, slippage, priorityFee, pool }
      });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Swap failed', details: e.message });
  }
}));

/**
 * @route GET /api/tokens/trending
 * @desc Get trending tokens with optional time filter
 * @access Public
 */
router.get('/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const timeFrame = req.query.timeFrame as '1h' | '24h' | '7d' | '30d' || '24h';
    const trendingTokens = await getTrendingTokens(timeFrame);
    res.json(trendingTokens);
  })
);

/**
 * @route GET /api/tokens/trending-by-address
 * @desc Get trending tokens using address from token_metadata
 * @access Public
 */
router.get('/trending-by-address',
  asyncHandler(async (req: Request, res: Response) => {
    const timeFrame = req.query.timeFrame as '1h' | '24h' | '7d' | '30d' || '24h';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const trendingTokens = await getMoralisTrendingWithDbComparison(limit, timeFrame);
    res.json(trendingTokens);
  })
);

/**
 * @route POST /api/tokens/quick-create
 * @desc Quick action token creation (single request, no step-by-step flow)
 * @access Private
 */
router.post('/quick-create', authMiddleware, upload.single('file'), asyncHandler(async (req: TokenCreationRequest, res: Response) => {
  const userId = req.user?.wallet;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { name, symbol, description, twitter, telegram, website, amount } = req.body;
  if (!name || !symbol || !amount) {
    return res.status(400).json({ error: 'Missing required fields: name, symbol, and amount are required.' });
  }

  let imageUrl;
  if (req.file) {
    try {
      imageUrl = await uploadImageToIPFS(req.file);
    } catch (e: unknown) {
      return res.status(500).json({ error: 'Failed to upload image to IPFS' });
    }
  } else {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  const metadata = {
    name,
    symbol,
    description: description || 'No description provided',
    twitter: twitter || '',
    telegram: telegram || '',
    website: website || '',
    image: imageUrl,
    showName: 'true'
  };

  let metadataUri;
  try {
    metadataUri = await uploadMetadataToIPFS(metadata);
  } catch (e: unknown) {
    return res.status(500).json({ error: 'Failed to upload metadata to IPFS' });
  }

  const mintKeypair = Keypair.generate();
  const pumpRequestBody = {
    publicKey: userId,
    action: 'create',
    tokenMetadata: {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUri
    },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: 'true',
    amount: Number(amount),
    slippage: 10,
    priorityFee: 0.0005,
    pool: 'pump',
    skipLiquidity: Number(amount) === 0
  };

  console.log('PumpPortal create request:', JSON.stringify(pumpRequestBody, null, 2));
  const createRes = await (await import('node-fetch')).default('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pumpRequestBody)
  });

  const contentType = createRes.headers.get('content-type');
  const buffer = await createRes.arrayBuffer();

  if (contentType && contentType.includes('application/json')) {
    const text = Buffer.from(buffer).toString('utf-8');
    let createJson;
    try {
      createJson = JSON.parse(text);
    } catch (e: unknown) {
      return res.status(500).json({ error: 'Token creation failed', details: text });
    }
    if (createJson.error) {
      return res.status(500).json({ error: 'Token creation failed', details: createJson.error });
    }
    await saveUserToken(userId, {
      mint: createJson.mint,
      name: metadata.name,
      symbol: metadata.symbol,
      image: metadata.image
    });
    return res.json({
      message: 'Token created successfully!',
      mint: createJson.mint,
      transaction: createJson.transaction,
      explorer: `https://solscan.io/tx/${createJson.transaction}`
    });
  }

  console.log('PumpPortal returned non-JSON response (likely a transaction)');
  const transactionBase64 = Buffer.from(buffer).toString('base64');
  return res.status(200).json({
    message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
    unsignedTransaction: transactionBase64,
    mint: mintKeypair.publicKey.toBase58(),
  });
}));

// Continue token creation
router.post('/create/continue', async (req: Request, res: Response) => {
  try {
    const { message, walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const tokenService = serviceFactory.getTokenService();
    const response = await tokenService.handleCreationIntent(message, { walletAddress, messages: [] });

    res.json({ response });
  } catch (error) {
    console.error('Error continuing token creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get token creation session
router.get('/create/session', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const tokenService = serviceFactory.getTokenService();
    const session = await tokenService.getSession(walletAddress as string);

    res.json({ session });
  } catch (error) {
    console.error('Error getting token creation session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel token creation
router.post('/create/cancel', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const tokenService = serviceFactory.getTokenService();
    await tokenService.cancelSession(walletAddress);

    res.json({ message: 'Token creation cancelled' });
  } catch (error) {
    console.error('Error cancelling token creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import FormData from 'form-data';
import fetch from 'node-fetch';
// TEMPORARY: Importing Pinata IPFS upload from referencefile. Move to backend/src/lib/pinata.ts in production.
import { uploadImageToIPFS as pinataUploadImageToIPFS } from '../lib/pinata';

// In-memory session store (replace with Redis in production)
export const tokenCreationSessions: Record<string, any> = {};

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed');

const TOKEN_CREATION_STEPS = [
  'pool',
  'image',
  'name',
  'symbol',
  'description',
  'twitter',
  'telegram',
  'website',
  'amount',
  'confirmation'
];

function getNextStep(currentStep: string | null) {
  if (!currentStep) return TOKEN_CREATION_STEPS[0];
  const idx = TOKEN_CREATION_STEPS.indexOf(currentStep);
  return TOKEN_CREATION_STEPS[idx + 1] || null;
}

function getPreviousStep(currentStep: string | null) {
  if (!currentStep) return null;
  const idx = TOKEN_CREATION_STEPS.indexOf(currentStep);
  return idx > 0 ? TOKEN_CREATION_STEPS[idx - 1] : null;
}

function validateStepInput(step: string, input: any): string | null {
  switch (step) {
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
    case 'pool':
      if (!input || !['pump', 'bonk'].includes(input.toLowerCase())) return 'Pool must be either "pump" or "bonk".';
      return null;
    default:
      return null;
  }
}

async function createTokenMetadata(
  name: string,
  symbol: string,
  description: string,
  imageFile: Express.Multer.File,
  twitter: string,
  telegram: string,
  website: string,
  pool: string
): Promise<string> {
  if (pool === 'pump') {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("symbol", symbol);
    formData.append("description", description);
    formData.append("twitter", twitter);
    formData.append("telegram", telegram);
    formData.append("website", website);
    formData.append("showName", "true");
    formData.append("file", imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype
    });

    // Debug log for form data fields and image size
    console.log('[DEBUG] FormData fields:', {
      name,
      symbol,
      description,
      twitter,
      telegram,
      website,
      showName: "true",
      imageFileName: imageFile.originalname,
      imageMimeType: imageFile.mimetype,
      imageSize: imageFile.buffer.length
    });

    const response = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });
    const text = await response.text();
    console.log('[DEBUG] Pump API raw response:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Pump API did not return valid JSON: ${text}`);
    }
    return data.metadataUri;
  } else if (pool === 'bonk') {
    // --- Bonk flow: upload image to Bonk, then metadata to Bonk ---
    const imgForm = new FormData();
    imgForm.append("image", imageFile.buffer, {
      filename: imageFile.originalname || 'image.png',
      contentType: imageFile.mimetype || 'image/png'
    });
    const imgResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/img", {
      method: "POST",
      body: imgForm,
      headers: imgForm.getHeaders(), // Only for Bonk
    });
    const imgText = await imgResponse.text();
    console.log('[DEBUG] Bonk image upload raw response:', imgText);
    let imgUri;
    try {
      const imgJson = JSON.parse(imgText);
      if (imgJson.success && imgJson.url) {
        imgUri = imgJson.url;
      } else {
        throw new Error('Bonk image upload failed: ' + imgText);
      }
    } catch {
      imgUri = imgText; // fallback for plain URL
    }
    const metaBody = {
      createdOn: "https://bonk.fun",
      description,
      image: imgUri,
      name,
      symbol,
      ...(website && /^https?:\/\//.test(website) ? { website } : {})
    };
    const metaResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaBody),
    });
    const metaText = await metaResponse.text();
    console.log('[DEBUG] Bonk metadata upload response:', metaText);
    let metadataUri;
    try {
      const metaJson = JSON.parse(metaText);
      if (metaJson.success && metaJson.url) {
        metadataUri = metaJson.url;
      } else {
        throw new Error('Bonk metadata upload failed: ' + metaText);
      }
    } catch {
      metadataUri = metaText; // fallback for plain URL
    }
    return metadataUri;
  }
  throw new Error('Invalid pool type');
}

async function createTokenTransaction(
  publicKey: string,
  tokenMetadata: any,
  mintKeypairOrPubkey: any, // can be Keypair or string
  amount: number,
  pool: string
): Promise<{ unsignedTransaction: string, signature?: string, mint?: string }> {
  const isBonk = pool === 'bonk';
  const baseUrl = isBonk
    ? `https://pumpportal.fun/api/trade?api-key=${process.env.PUMP_PORTAL_API_KEY}`
    : 'https://pumpportal.fun/api/trade-local';

  // For Bonk, mint must be the base58-encoded secret key
  let mint;
  if (isBonk) {
    // If mintKeypairOrPubkey is a Keypair, encode its secretKey
    if (typeof mintKeypairOrPubkey === 'object' && mintKeypairOrPubkey.secretKey) {
      mint = bs58.encode(mintKeypairOrPubkey.secretKey);
    } else {
      mint = mintKeypairOrPubkey; // fallback
    }
  } else {
    // For pump, use public key
    if (typeof mintKeypairOrPubkey === 'object' && mintKeypairOrPubkey.publicKey) {
      mint = mintKeypairOrPubkey.publicKey.toBase58();
    } else {
      mint = mintKeypairOrPubkey;
    }
  }

  // For Bonk, do not include image in tokenMetadata
  const tokenMetadataPayload = isBonk
    ? {
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri
      }
    : {
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
        image: tokenMetadata.image
      };

  const payload = {
    publicKey,
    action: "create",
    tokenMetadata: tokenMetadataPayload,
    mint,
    denominatedInSol: "true",
    amount: Number(amount),
    slippage: isBonk ? 5 : 0.5,
    priorityFee: isBonk ? 0.00005 : 0,
    pool
  };
  // Add debug log to show the exact payload for Pump Portal
  console.log('[DEBUG] Pump Portal FINAL PAYLOAD:', JSON.stringify(payload, null, 2));

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PUMP_PORTAL_API_KEY && !isBonk ? { "api-key": process.env.PUMP_PORTAL_API_KEY } : {})
    },
    body: JSON.stringify(payload)
  });

  if (response.status !== 200) {
    throw new Error(`Failed to create token: ${response.statusText}`);
  }

  if (!isBonk) {
    const data = await response.arrayBuffer();
    return {
      unsignedTransaction: Buffer.from(data).toString('base64'),
      mint
    };
  } else {
    const data = await response.json();
    return {
      unsignedTransaction: '', // Bonk doesn't return an unsigned transaction
      signature: data.signature,
      mint
    };
  }
}

export class TokenCreationService {
  // Multi-step chat flow for token creation
  async handleCreationIntent(message: string, context: any) {
    const userId = context.walletAddress || 'default';
    // If the message is 'create token', reset the session
    if (message.trim().toLowerCase() === 'create token') {
      console.log('[DEBUG] Resetting token creation session for user:', userId);
      delete tokenCreationSessions[userId];
    }
    let session = tokenCreationSessions[userId] || { step: null };
    let { step } = session;
    const userInput = message.trim();

    // If no step, this is the first call after reset: prompt for pool and do NOT advance
    if (!step) {
      step = 'pool';
      session.step = step;
      tokenCreationSessions[userId] = session;
      const prompt = 'Which pool would you like to use? (pump or bonk)';
      console.log('[DEBUG] Returning step:', step, 'prompt:', prompt);
      return { prompt, step };
    }

    // Handle cancel
    if (userInput.toLowerCase() === 'cancel' || userInput.toLowerCase() === 'abort') {
      delete tokenCreationSessions[userId];
      return { prompt: 'Token creation cancelled.', step: null };
    }

    // Handle back
    if (userInput.toLowerCase() === 'back') {
      const prevStep = getPreviousStep(step);
      if (!prevStep) return { prompt: 'Already at the first step.', step };
      session.step = prevStep;
      tokenCreationSessions[userId] = session;
      return { prompt: `Going back. Please provide ${prevStep}.`, step: prevStep };
    }

    // Validate the current step input
    let processedInput = userInput;
    if (["twitter", "telegram", "website"].includes(step) && userInput.trim().toLowerCase() === "skip") {
      processedInput = '';
    }
    if (step === 'symbol') {
      processedInput = userInput.trim().toUpperCase();
    }
    const validationError = validateStepInput(step, processedInput);
    if (validationError) {
      return { prompt: validationError, step };
    }

    // Store the input in the session
    session[step] = processedInput;
    tokenCreationSessions[userId] = session;

    // Special handling for pool step: advance immediately to image
    if (step === 'pool') {
      // Normalize and store pool
      const poolValue = userInput.trim().toLowerCase();
      if (!['pump', 'bonk'].includes(poolValue)) {
        return { prompt: 'Pool must be either "pump" or "bonk".', step };
      }
      session.pool = poolValue;
      session.step = 'image';
      tokenCreationSessions[userId] = session;
      return {
        prompt: `Please upload an image for your token (${poolValue === 'pump' ? 'Pump' : 'Bonk'} flow).`,
        step: 'image'
      };
    }

    // If the current step is 'image', only accept file uploads, not text
    if (step === 'image') {
      return { prompt: 'Please upload an image file to continue.', step: 'image' };
    }

    // Get the next step
    const nextStep = getNextStep(step);
    session.step = nextStep;
    tokenCreationSessions[userId] = session;

    // Branch the flow based on the selected pool
    if (nextStep === 'image') {
      if (session.pool === 'pump') {
        return { prompt: 'Please upload an image for your token (Pump flow).', step: nextStep };
      } else if (session.pool === 'bonk') {
        return { prompt: 'Please upload an image for your token (Bonk flow).', step: nextStep };
      }
    }

    // Only prompt for the next step, not the current one
    if (nextStep) {
      let prompt = '';
      switch (nextStep) {
        case 'image': prompt = 'Please upload an image for your token.'; break;
        case 'name': prompt = 'What is the name of your token?'; break;
        case 'symbol': prompt = 'What is the symbol? (2-10 uppercase letters or numbers)'; break;
        case 'amount': prompt = 'How many tokens would you like to create?'; break;
        case 'description': prompt = 'Please provide a description.'; break;
        case 'twitter': prompt = 'Twitter link? (must be a valid URL, or type "skip" to leave blank)'; break;
        case 'telegram': prompt = 'Telegram link? (must be a valid URL, or type "skip" to leave blank)'; break;
        case 'website': prompt = 'Website? (must be a valid URL, or type "skip" to leave blank)'; break;
        case 'pool': prompt = 'Which pool would you like to use? (pump or bonk)'; break;
        case 'confirmation': {
          // Create a summary of the token creation details
          const summary = `Please review your token details:\n` +
            `Name: ${session.name}\n` +
            `Symbol: ${session.symbol}\n` +
            `Amount: ${session.amount}\n` +
            `Description: ${session.description}\n` +
            `Twitter: ${session.twitter || 'Not provided'}\n` +
            `Telegram: ${session.telegram || 'Not provided'}\n` +
            `Website: ${session.website || 'Not provided'}\n` +
            `Pool: ${session.pool}\n\n` +
            `Type 'proceed' to create your token or 'cancel' to abort.`;
          prompt = summary;
          break;
        }
        default: prompt = 'Invalid step.'; break;
      }
      console.log('[DEBUG] Returning step:', nextStep, 'prompt:', prompt);
      return { prompt, step: nextStep };
    }

    // If we've completed all steps, handle the confirmation
    if (step === 'confirmation') {
      if (userInput.toLowerCase() === 'proceed') {
        try {
          // Proceed with token creation
          const result = await this.createToken({
            name: session.name,
            symbol: session.symbol,
            amount: session.amount,
            description: session.description,
            twitter: session.twitter,
            telegram: session.telegram,
            website: session.website,
            pool: session.pool,
            imageFile: session.imageFile,
            publicKey: context.walletAddress,
            bonkImageUrl: session.bonkImageUrl,
            bonkMetadataUri: session.bonkMetadataUri
          });
          delete tokenCreationSessions[userId];
          return { prompt: 'Token creation initiated successfully!', step: null, result };
        } catch (error: any) {
          console.error('[ERROR] Token creation failed:', error);
          return { prompt: `Failed to create token: ${error.message}`, step: null };
        }
      } else {
        return { prompt: 'Token creation cancelled.', step: null };
      }
    }
  }

  getSession(userId: string) {
    return tokenCreationSessions[userId] || null;
  }

  cancelSession(userId: string) {
    delete tokenCreationSessions[userId];
    return { prompt: 'Token creation cancelled.' };
  }

  async createToken(params: any) {
    if (!params.publicKey) {
      throw new Error('No publicKey provided for token creation.');
    }
    let imageUri = null;
    let metadataUri = null;
    if (params.pool === 'bonk') {
      // Upload metadata to Bonk now, using all collected fields and the Bonk image URL
      const imgUri = params.bonkImageUrl;
      const metaBody = {
        createdOn: "https://bonk.fun",
        description: params.description,
        image: imgUri,
        name: params.name,
        symbol: params.symbol,
        ...(params.website && /^https?:\/\//.test(params.website) ? { website: params.website } : {})
      };
      const metaResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaBody),
      });
      const metaText = await metaResponse.text();
      let bonkMetadataUri;
      try {
        const metaJson = JSON.parse(metaText);
        if (metaJson.success && metaJson.url) {
          bonkMetadataUri = metaJson.url;
        } else {
          throw new Error('Bonk metadata upload failed: ' + metaText);
        }
      } catch {
        bonkMetadataUri = metaText;
      }
      imageUri = imgUri;
      metadataUri = bonkMetadataUri;
    } else {
      // Pump flow (unchanged)
      imageUri = await pinataUploadImageToIPFS(params.imageFile);
      metadataUri = await createTokenMetadata(
        params.name,
        params.symbol,
        params.description,
        params.imageFile,
        params.twitter || '',
        params.telegram || '',
        params.website || '',
        params.pool
      );
    }
    // Generate a random keypair for the mint
    const mintKeypair = Keypair.generate();
    // Create token transaction
    const result = await createTokenTransaction(
      params.publicKey,
      {
        name: params.name,
        symbol: params.symbol,
        uri: metadataUri,
        image: imageUri
      },
      mintKeypair, // pass the Keypair, not just public key
      params.amount,
      params.pool
    );

    // If a signature is returned, check transaction status before returning success
    if (result.signature) {
      const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com', 'confirmed');
      let confirmed = false;
      try {
        // Wait for confirmation (up to 20s)
        for (let i = 0; i < 20; i++) {
          const tx = await connection.getConfirmedTransaction(result.signature, 'confirmed');
          if (tx && tx.meta && !tx.meta.err) {
            confirmed = true;
            break;
          }
          await new Promise(res => setTimeout(res, 1000));
        }
      } catch (e) {
        // ignore
      }
      if (!confirmed) {
        throw new Error('Token creation failed: Transaction was not confirmed. Please check your wallet balance and try again.');
      }
      return {
        prompt: 'Token creation initiated successfully! Please sign and submit the transaction with your wallet.',
        result: {
          ...result,
          mint: mintKeypair.publicKey.toBase58(),
          explorerTemplate: 'https://solscan.io/tx/{signature}'
        }
      };
    }
    // For Pump, just return the result (user must sign)
    return {
      prompt: 'Token creation initiated successfully! Please sign and submit the transaction with your wallet.',
      result: {
        ...result,
        mint: mintKeypair.publicKey.toBase58(),
        explorerTemplate: 'https://solscan.io/tx/{signature}'
      }
    };
  }

  async handleImageUpload(file: Express.Multer.File, context: { walletAddress: string }) {
    const userId = context.walletAddress || 'default';
    let session = tokenCreationSessions[userId] || { step: 'image' };
    // Handle image upload based on selected pool
    if (session.pool === 'bonk') {
      // Upload to Bonk and store the URL
      const FormData = (await import('form-data')).default;
      const imgForm = new FormData();
      imgForm.append("image", file.buffer, {
        filename: file.originalname || 'image.png',
        contentType: file.mimetype || 'image/png'
      });
      const imgResponse = await fetch("https://nft-storage.letsbonk22.workers.dev/upload/img", {
        method: "POST",
        body: imgForm,
        headers: imgForm.getHeaders(),
      });
      const imgText = await imgResponse.text();
      console.log('[DEBUG] Bonk image upload raw response:', imgText);
      let imgUri;
      try {
        const imgJson = JSON.parse(imgText);
        if (imgJson.success && imgJson.url) {
          imgUri = imgJson.url;
        } else {
          throw new Error('Bonk image upload failed: ' + imgText);
        }
      } catch {
        imgUri = imgText;
      }
      session.bonkImageUrl = imgUri;
      // Do NOT upload metadata here!
    } else {
      // For pump, store the file for later Pinata upload
      session.imageFile = file;
    }
    session.step = 'name';
    tokenCreationSessions[userId] = session;
    return {
      prompt: "Great! I've saved your token image. Now, please provide a name for your token.",
      step: 'name'
    };
  }
} 
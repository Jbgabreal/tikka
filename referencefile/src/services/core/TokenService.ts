import { ChatContext } from '../../types/chat.js';
import { Keypair } from '@solana/web3.js';
import { uploadImageToIPFS, uploadMetadataToIPFS } from '../../lib/pinata.js';
import { redis } from '../../redis/index.js';
import { query } from '../../database/index.js';
import { TokenCreationSession, FileUpload } from '../../types/token.js';

export class TokenService {
  private readonly TOKEN_CREATION_STEPS = [
    'image',
    'name',
    'symbol',
    'amount',
    'description',
    'twitter',
    'telegram',
    'website',
    'confirm'
  ];

  /**
   * Handle token creation intent from chat
   */
  async handleCreationIntent(message: string, context: ChatContext): Promise<string> {
    const userId = context.walletAddress;
    if (!userId) {
      return 'Please connect your wallet to create a token.';
    }

    let session = await this.getOrCreateSession(userId);
    
    // If no step is set, start with image
    if (!session.step) {
      session.step = 'image';
      await this.saveSession(userId, session);
      return 'Please upload an image for your token.';
    }

    return this.handleCurrentStep(session, message, userId);
  }

  /**
   * Handle file upload for token creation
   */
  async handleFileUpload(file: FileUpload, userId: string): Promise<string> {
    const session = await this.getOrCreateSession(userId);
    
    if (session.step !== 'image') {
      await this.clearSession(userId);
      session.step = 'image';
    }

    try {
      const imageUrl = await uploadImageToIPFS(file);
      session.image = imageUrl;
      
      // Move to next step
      const nextStep = this.getNextStep(session.step);
      session.step = nextStep;
      await this.saveSession(userId, session);

      return `Great! I've saved your token image. Now, please provide a name for your token.`;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return 'Sorry, I failed to upload your image. Please try again.';
    }
  }

  /**
   * Handle text input for current step
   */
  private async handleCurrentStep(session: TokenCreationSession, input: string, userId: string): Promise<string> {
    // Handle confirmation
    if (session.awaitingConfirmation) {
      return this.handleConfirmation(session, input, userId);
    }

    // Handle back command
    if (input.toLowerCase() === 'back') {
      const prevStep = this.getPreviousStep(session.step);
      if (!prevStep) {
        return 'Already at the first step.';
      }
      session.step = prevStep;
      await this.saveSession(userId, session);
      return `Going back. Please provide ${prevStep}.`;
    }

    // Handle edit command
    if (input.toLowerCase().startsWith('edit ')) {
      const editField = input.split(' ')[1];
      if (!this.TOKEN_CREATION_STEPS.includes(editField)) {
        return 'Unknown field to edit.';
      }
      session.step = editField;
      await this.saveSession(userId, session);
      return `Editing ${editField}. Please provide a new value.`;
    }

    // Validate and save input
    const validationError = this.validateStepInput(session.step, input);
    if (validationError) {
      session.validationErrorCount = (session.validationErrorCount || 0) + 1;
      await this.saveSession(userId, session);
      
      if (session.validationErrorCount >= 3) {
        await this.clearSession(userId);
        return 'Token creation cancelled due to repeated invalid input. Please start again if you wish to create a token.';
      }
      
      return validationError;
    }

    // Save valid input
    session.validationErrorCount = 0;
    if (session.step) {
      session[session.step] = input;
    }
    
    // Move to next step
    const nextStep = this.getNextStep(session.step);
    session.step = nextStep;
    await this.saveSession(userId, session);

    // If all steps are complete, show confirmation
    if (!nextStep) {
      return this.showConfirmation(session);
    }

    // Show prompt for next step
    return this.getStepPrompt(nextStep);
  }

  /**
   * Handle confirmation response
   */
  private async handleConfirmation(session: TokenCreationSession, input: string, userId: string): Promise<string> {
    if (input.toLowerCase() === 'proceed') {
      try {
        const result = await this.createToken(session, userId);
        await this.clearSession(userId);
        return result;
      } catch (error) {
        console.error('Token creation failed:', error);
        return 'Sorry, token creation failed. Please try again.';
      }
    } else if (input.toLowerCase() === 'abort' || input.toLowerCase() === 'cancel') {
      await this.clearSession(userId);
      return 'Token creation aborted.';
    } else {
      return this.showConfirmation(session);
    }
  }

  /**
   * Create token with collected information
   */
  private async createToken(session: TokenCreationSession, userId: string): Promise<string> {
    // Upload metadata to IPFS
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

    const metadataUri = await uploadMetadataToIPFS(metadata);
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    
    // Create token via PumpPortal
    const createRequest = {
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

    const response = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createRequest)
    });

    if (!response.ok) {
      throw new Error('Failed to create token');
    }

    const result = await response.json();
    
    // Store token in database
    await this.storeToken(mintKeypair.publicKey.toBase58(), metadata, userId);

    return `Token created successfully! Transaction: ${result.signature}`;
  }

  /**
   * Store token in database
   */
  private async storeToken(mintAddress: string, metadata: any, userId: string): Promise<void> {
    await query(
      'INSERT INTO tokens (mint_address, name, symbol, description, image_uri, twitter, telegram, website, creator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        mintAddress,
        metadata.name,
        metadata.symbol,
        metadata.description,
        metadata.image,
        metadata.twitter,
        metadata.telegram,
        metadata.website,
        userId
      ]
    );
  }

  /**
   * Get or create session
   */
  private async getOrCreateSession(userId: string): Promise<TokenCreationSession> {
    const session = await this.getSession(userId);
    return session || { step: null };
  }

  /**
   * Save session
   */
  private async saveSession(userId: string, session: TokenCreationSession): Promise<void> {
    await redis.set(
      `token_creation:${userId}`,
      JSON.stringify(session),
      { EX: 3600 } // 1 hour expiry
    );
  }

  /**
   * Clear session
   */
  private async clearSession(userId: string): Promise<void> {
    await redis.del(`token_creation:${userId}`);
  }

  /**
   * Get next step
   */
  private getNextStep(currentStep: string | null): string | null {
    if (!currentStep) return this.TOKEN_CREATION_STEPS[0];
    const idx = this.TOKEN_CREATION_STEPS.indexOf(currentStep);
    return this.TOKEN_CREATION_STEPS[idx + 1] || null;
  }

  /**
   * Get previous step
   */
  private getPreviousStep(currentStep: string | null): string | null {
    if (!currentStep) return null;
    const idx = this.TOKEN_CREATION_STEPS.indexOf(currentStep);
    return idx > 0 ? this.TOKEN_CREATION_STEPS[idx - 1] : null;
  }

  /**
   * Validate step input
   */
  private validateStepInput(step: string | null, input: string): string | null {
    if (!step) return 'Invalid step';
    
    switch (step) {
      case 'name':
        if (!input || input.length < 1 || input.length > 50) {
          return 'Name must be between 1 and 50 characters.';
        }
        break;
      case 'symbol':
        const symbol = input.trim().toUpperCase();
        if (!symbol || symbol.length < 2 || symbol.length > 10 || !/^[A-Z0-9]+$/.test(symbol)) {
          return 'Symbol must be 2-10 uppercase letters or numbers.';
        }
        break;
      case 'amount':
        const amount = Number(input);
        if (isNaN(amount) || amount < 0) {
          return 'Amount must be a positive number.';
        }
        break;
      case 'twitter':
      case 'telegram':
      case 'website':
        if (input.toLowerCase() !== 'skip' && !this.isValidUrl(input)) {
          return 'Please provide a valid URL or type "skip".';
        }
        break;
    }
    
    return null;
  }

  /**
   * Show confirmation summary
   */
  private showConfirmation(session: TokenCreationSession): string {
    return `📝 **Token Creation Summary**\n` +
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
  }

  /**
   * Get step prompt
   */
  private getStepPrompt(step: string): string {
    switch (step) {
      case 'image': return 'Please upload an image for your token.';
      case 'name': return 'What is the name of your token?';
      case 'symbol': return 'What is the symbol? (2-10 uppercase letters or numbers)';
      case 'amount': return 'How many tokens would you like to create?';
      case 'description': return 'Please provide a description.';
      case 'twitter': return 'Twitter link? (must be a valid URL, or type "skip" to leave blank)';
      case 'telegram': return 'Telegram link? (must be a valid URL, or type "skip" to leave blank)';
      case 'website': return 'Website? (must be a valid URL, or type "skip" to leave blank)';
      default: return 'Please provide the required information.';
    }
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public async getSession(walletAddress: string): Promise<TokenCreationSession | null> {
    const session = await redis.get(`token_creation:${walletAddress}`);
    return session ? JSON.parse(session) : null;
  }

  public async cancelSession(walletAddress: string): Promise<void> {
    await redis.del(`token_creation:${walletAddress}`);
  }
} 
import { ChatContext } from '../../types/chat.js';
import { setSwapSession, getSwapSession, clearSwapSession } from '../../redis/index.js';

interface SwapSession {
  step: string | null;
  fromToken?: string;
  toToken?: string;
  amount?: number;
  validationErrorCount?: number;
  awaitingConfirmation?: boolean;
  [key: string]: any;
}

export class SwapService {
  private readonly SWAP_STEPS = ['fromToken', 'toToken', 'amount'];
  private readonly SOL_MINT = 'So11111111111111111111111111111111111111112';

  /**
   * Handle swap intent from chat
   */
  async handleSwapIntent(message: string, context: ChatContext): Promise<string> {
    const userId = context.walletAddress;
    if (!userId) {
      return 'Please connect your wallet to perform a swap.';
    }

    let session = await this.getOrCreateSession(userId);
    
    // If no step is set, start with fromToken
    if (!session.step) {
      session.step = 'fromToken';
      await this.saveSession(userId, session);
      return 'Which token do you want to swap from? (symbol or mint address)';
    }

    return this.handleCurrentStep(session, message, userId);
  }

  /**
   * Handle text input for current step
   */
  private async handleCurrentStep(session: SwapSession, input: string, userId: string): Promise<string> {
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

    // Validate and save input
    const validationError = this.validateStepInput(session.step, input);
    if (validationError) {
      session.validationErrorCount = (session.validationErrorCount || 0) + 1;
      await this.saveSession(userId, session);
      
      if (session.validationErrorCount >= 3) {
        await this.clearSession(userId);
        return 'Swap cancelled due to repeated invalid input. Please start again if you wish to perform a swap.';
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
  private async handleConfirmation(session: SwapSession, input: string, userId: string): Promise<string> {
    if (input.toLowerCase() === 'proceed') {
      try {
        const result = await this.executeSwap(session, userId);
        await this.clearSession(userId);
        return result;
      } catch (error) {
        console.error('Swap failed:', error);
        return 'Sorry, the swap failed. Please try again.';
      }
    } else if (input.toLowerCase() === 'abort' || input.toLowerCase() === 'cancel') {
      await this.clearSession(userId);
      return 'Swap aborted.';
    } else {
      return this.showConfirmation(session);
    }
  }

  /**
   * Execute swap with collected information
   */
  private async executeSwap(session: SwapSession, userId: string): Promise<string> {
    // Determine action and params
    let action: 'buy' | 'sell';
    let mint: string;
    let denominatedInSol: boolean;
    let amount: number;

    if (session.fromToken === this.SOL_MINT) {
      // Swapping SOL to token (buy)
      action = 'buy';
      mint = session.toToken!;
      denominatedInSol = true;
      amount = session.amount!;
    } else if (session.toToken === this.SOL_MINT) {
      // Swapping token to SOL (sell)
      action = 'sell';
      mint = session.fromToken!;
      denominatedInSol = false;
      amount = session.amount!;
    } else {
      throw new Error('Only SOL <-> token swaps are supported at this time.');
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

    const response = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest)
    });

    if (!response.ok) {
      throw new Error('Failed to execute swap');
    }

    const result = await response.json();
    return `Swap transaction created! Please sign and submit the transaction.`;
  }

  /**
   * Get or create session
   */
  private async getOrCreateSession(userId: string): Promise<SwapSession> {
    const session = await getSwapSession(userId);
    return session || { step: null };
  }

  /**
   * Save session
   */
  private async saveSession(userId: string, session: SwapSession): Promise<void> {
    await setSwapSession(userId, session);
  }

  /**
   * Clear session
   */
  private async clearSession(userId: string): Promise<void> {
    await clearSwapSession(userId);
  }

  /**
   * Get next step
   */
  private getNextStep(currentStep: string | null): string | null {
    if (!currentStep) return this.SWAP_STEPS[0];
    const idx = this.SWAP_STEPS.indexOf(currentStep);
    return this.SWAP_STEPS[idx + 1] || null;
  }

  /**
   * Get previous step
   */
  private getPreviousStep(currentStep: string | null): string | null {
    if (!currentStep) return null;
    const idx = this.SWAP_STEPS.indexOf(currentStep);
    return idx > 0 ? this.SWAP_STEPS[idx - 1] : null;
  }

  /**
   * Validate step input
   */
  private validateStepInput(step: string | null, input: string): string | null {
    if (!step) return 'Invalid step';
    
    switch (step) {
      case 'fromToken':
      case 'toToken':
        if (!input || typeof input !== 'string' || input.length < 2) {
          return 'Please provide a valid token symbol or mint address.';
        }
        break;
      case 'amount':
        const amount = Number(input);
        if (isNaN(amount) || amount <= 0) {
          return 'Amount must be a positive number.';
        }
        break;
    }
    
    return null;
  }

  /**
   * Show confirmation summary
   */
  private showConfirmation(session: SwapSession): string {
    return `🔄 **Swap Summary**\n` +
      `-----------------------------\n` +
      `**From:** ${session.fromToken || '-'}\n` +
      `**To:** ${session.toToken || '-'}\n` +
      `**Amount:** ${session.amount || '-'}\n` +
      `-----------------------------\n` +
      `\nReply 'proceed' to perform the swap, or 'abort'/'cancel' to stop.`;
  }

  /**
   * Get step prompt
   */
  private getStepPrompt(step: string): string {
    switch (step) {
      case 'fromToken': return 'Which token do you want to swap from? (symbol or mint address)';
      case 'toToken': return 'Which token do you want to swap to? (symbol or mint address)';
      case 'amount': return 'How much do you want to swap?';
      default: return 'Please provide the required information.';
    }
  }
} 
import fetch from 'node-fetch';

// In-memory session store (replace with Redis in production)
export const swapSessions: Record<string, any> = {};

const SWAP_STEPS = ['fromToken', 'toToken', 'amount', 'confirmation'];
const SOL_MINT = 'So11111111111111111111111111111111111111112';

function getNextStep(currentStep: string | null) {
  if (!currentStep) return SWAP_STEPS[0];
  const idx = SWAP_STEPS.indexOf(currentStep);
  return SWAP_STEPS[idx + 1] || null;
}

function getPreviousStep(currentStep: string | null) {
  if (!currentStep) return null;
  const idx = SWAP_STEPS.indexOf(currentStep);
  return idx > 0 ? SWAP_STEPS[idx - 1] : null;
}

function isValidSolanaAddress(address: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function validateSwapStepInput(step: string, input: any): string | null {
  switch (step) {
    case 'fromToken':
    case 'toToken':
      if (!input || typeof input !== 'string' || input.length < 2) return 'Please provide a valid token symbol or mint address.';
      if (!isValidSolanaAddress(input) && !/^[A-Z0-9]{2,10}$/.test(input)) {
        return 'Invalid token symbol or mint address format.';
      }
      return null;
    case 'amount':
      if (input === undefined || isNaN(Number(input)) || Number(input) <= 0) return 'Amount must be a positive number.';
      return null;
    default:
      return null;
  }
}

export class TokenSwapService {
  // Multi-step chat flow for token swap
  async handleSwapIntent(message: string, context: any) {
    const userId = context.walletAddress || 'default';
    const userInput = message.trim();
    // Always handle cancel/abort first
    if (userInput.toLowerCase() === 'cancel' || userInput.toLowerCase() === 'abort') {
      delete swapSessions[userId];
      return { prompt: 'Swap cancelled.', step: null };
    }
    // If the message is 'swap token', reset the session
    if (message.trim().toLowerCase() === 'swap token') {
      delete swapSessions[userId];
    }
    let session = swapSessions[userId] || { step: null };
    let { step } = session;

    // If no step, this is the first call after reset: prompt for fromToken and do NOT advance
    if (!step) {
      step = 'fromToken';
      session.step = step;
      swapSessions[userId] = session;
      return { prompt: 'Which token do you want to swap from? (symbol or mint address)', step };
    }

    // Handle back
    if (userInput.toLowerCase() === 'back') {
      const prevStep = getPreviousStep(step);
      if (!prevStep) return { prompt: 'Already at the first step.', step };
      session.step = prevStep;
      swapSessions[userId] = session;
      return { prompt: `Going back. Please provide ${prevStep}.`, step: prevStep };
    }

    // Save input for current step
    if (step) {
      if (step === 'amount') {
        session[step] = Number(userInput);
      } else {
        session[step] = userInput;
      }
      // Validate input
      const validationError = validateSwapStepInput(step, session[step]);
      if (validationError) {
        session.validationErrorCount = (session.validationErrorCount || 0) + 1;
        swapSessions[userId] = session;
        if (session.validationErrorCount >= 3) {
          delete swapSessions[userId];
          return { prompt: 'Swap cancelled due to repeated invalid input. Please start again.', step: null };
        }
        return { prompt: validationError, step };
      }
      session.validationErrorCount = 0;
    }

    // Advance to next step
    const nextStep = getNextStep(step);
    session.step = nextStep;
    swapSessions[userId] = session;

    // Only prompt for the next step, not the current one
    if (nextStep && nextStep !== 'confirmation') {
      let prompt = '';
      switch (nextStep) {
        case 'fromToken': prompt = 'Which token do you want to swap from? (symbol or mint address)'; break;
        case 'toToken': prompt = 'Which token do you want to swap to? (symbol or mint address)'; break;
        case 'amount': prompt = 'How much do you want to swap?'; break;
        default: prompt = 'Invalid step.'; break;
      }
      return { prompt, step: nextStep };
    }

    // If we've completed all steps, handle the confirmation
    if (nextStep === 'confirmation') {
      // Show summary and require 'proceed' to continue
      if (!session.awaitingConfirmation) {
        session.awaitingConfirmation = true;
        swapSessions[userId] = session;
        const summary = `🔄 **Swap Summary**\n` +
          `-----------------------------\n` +
          `**From:** ${session.fromToken || '-'}\n` +
          `**To:** ${session.toToken || '-'}\n` +
          `**Amount:** ${session.amount || '-'}\n` +
          `-----------------------------\n` +
          `\nType 'proceed' to perform the swap or 'cancel' to abort.`;
        return {
          prompt: summary,
          step: 'confirmation',
          requireSignature: false,
          swapDetails: {
            fromToken: session.fromToken,
            toToken: session.toToken,
            amount: session.amount
          }
        };
      }
    }

    // Handle confirmation if awaitingConfirmation is true and userInput is 'proceed'
    if (session.awaitingConfirmation && userInput.toLowerCase() === 'proceed') {
      try {
        session.awaitingConfirmation = false;
        // Determine action and params
        let action, mint, denominatedInSol, amount;
        if (session.fromToken === SOL_MINT) {
          action = 'buy';
          mint = session.toToken;
          denominatedInSol = true;
          amount = session.amount;
        } else if (session.toToken === SOL_MINT) {
          action = 'sell';
          mint = session.fromToken;
          denominatedInSol = false;
          amount = session.amount;
        } else {
          delete swapSessions[userId];
          return { prompt: 'Only SOL <-> token swaps are supported at this time.', step: null };
        }
        const swapRequest = {
          publicKey: context.walletAddress,
          action,
          mint,
          denominatedInSol: denominatedInSol.toString(),
          amount,
          slippage: 0.5,
          priorityFee: 0,
          pool: 'auto',
        };
        // Log the swap request payload for debugging
        console.log('[DEBUG] Swap request payload:', swapRequest);
        // Call PumpPortal
        const pumpRes = await fetch('https://pumpportal.fun/api/trade-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(swapRequest)
        });
        const contentType = pumpRes.headers.get('content-type');
        const buffer = await pumpRes.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');
        if (contentType && contentType.includes('application/json')) {
          let pumpJson;
          try { pumpJson = JSON.parse(text); } catch (e) { return { prompt: 'Swap failed', details: text, step: null }; }
          if (pumpJson.error) {
            return { prompt: 'Swap failed', details: pumpJson.error, step: null };
          }
          delete swapSessions[userId];
          return {
            prompt: 'Swap transaction created. Please sign and submit.',
            unsignedTx: pumpJson.unsignedTx,
            swapDetails: swapRequest,
            requireSignature: true,
            step: null
          };
        } else {
          // Assume it's a transaction buffer
          const transactionBase64 = Buffer.from(buffer).toString('base64');
          delete swapSessions[userId];
          return {
            prompt: 'Unsigned transaction generated. Please sign and submit with your wallet.',
            unsignedTransaction: transactionBase64,
            swapDetails: swapRequest,
            requireSignature: true,
            step: null
          };
        }
      } catch (e: any) {
        delete swapSessions[userId];
        return { prompt: 'Swap failed', details: e.message, step: null };
      }
    }

    // If we're still awaiting confirmation but user didn't type 'proceed', show the summary again
    if (session.awaitingConfirmation) {
      const summary = `🔄 **Swap Summary**\n` +
        `-----------------------------\n` +
        `**From:** ${session.fromToken || '-'}\n` +
        `**To:** ${session.toToken || '-'}\n` +
        `**Amount:** ${session.amount || '-'}\n` +
        `-----------------------------\n` +
        `\nType 'proceed' to perform the swap or 'cancel' to abort.`;
      return {
        prompt: summary,
        step: 'confirmation',
        requireSignature: false,
        swapDetails: {
          fromToken: session.fromToken,
          toToken: session.toToken,
          amount: session.amount
        }
      };
    }

    // If for some reason no code path above returns, log and return a fallback
    console.error('[TokenSwapService] handleSwapIntent reached unexpected end', { userId, step, session, userInput });
    return { prompt: 'Unexpected error in swap flow. Please try again.', step: null };
  }

  async swapToken({ fromToken, toToken, amount, slippage = 0.5, priorityFee = 0, pool = 'auto', publicKey }: any) {
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
      throw new Error('Only SOL <-> token swaps are supported at this time.');
    }
    const swapRequest = {
      publicKey,
      action,
      mint,
      denominatedInSol: denominatedInSol.toString(),
      amount,
      slippage,
      priorityFee,
      pool,
    };
    const pumpRes = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest)
    });
    const contentType = pumpRes.headers.get('content-type');
    const buffer = await pumpRes.arrayBuffer();
    const text = Buffer.from(buffer).toString('utf-8');
    if (contentType && contentType.includes('application/json')) {
      let pumpJson;
      try { pumpJson = JSON.parse(text); } catch (e) { throw new Error(text); }
      if (pumpJson.error) {
        throw new Error(pumpJson.error);
      }
      return {
        message: 'Swap transaction created. Please sign and submit.',
        unsignedTx: pumpJson.unsignedTx,
        swapDetails: swapRequest
      };
    } else {
      // Assume it's a transaction buffer
      const transactionBase64 = Buffer.from(buffer).toString('base64');
      return {
        message: 'Unsigned transaction generated. Please sign and submit with your wallet.',
        unsignedTransaction: transactionBase64,
        swapDetails: swapRequest
      };
    }
  }
} 
import { SwapSession } from '../types/chat.js';
import { setCache, getCache } from '../redis/index.js';

const CACHE_TTL = 3600; // 1 hour

export async function getSwapSession(userId: string): Promise<SwapSession | null> {
  return await getCache(`swap:${userId}`);
}

export async function clearSwapSession(userId: string): Promise<void> {
  await setCache(`swap:${userId}`, null, CACHE_TTL);
}

export async function saveSwapSession(userId: string, session: SwapSession): Promise<void> {
  await setCache(`swap:${userId}`, session, CACHE_TTL);
}

export async function handleSwapStep(
  session: SwapSession,
  input: string,
  userId: string
): Promise<{ response: string; step?: string; unsignedTransaction?: string }> {
  const { step } = session;

  switch (step) {
    case 'fromToken':
      // Validate token input
      if (!input || input.length < 2) {
        return {
          response: 'Please provide a valid token symbol or mint address.',
          step: 'fromToken'
        };
      }

      session.fromToken = input;
      session.step = 'toToken';
      await saveSwapSession(userId, session);
      return {
        response: 'Which token do you want to swap to? (symbol or mint address)',
        step: 'toToken'
      };

    case 'toToken':
      // Validate token input
      if (!input || input.length < 2) {
        return {
          response: 'Please provide a valid token symbol or mint address.',
          step: 'toToken'
        };
      }

      // Check if trying to swap to the same token
      if (input.toLowerCase() === session.fromToken?.toLowerCase()) {
        return {
          response: 'You cannot swap to the same token. Please choose a different token.',
          step: 'toToken'
        };
      }

      session.toToken = input;
      session.step = 'amount';
      await saveSwapSession(userId, session);
      return {
        response: 'How much would you like to swap? (Enter the amount)',
        step: 'amount'
      };

    case 'amount':
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) {
        return {
          response: 'Please provide a valid amount greater than 0.',
          step: 'amount'
        };
      }

      session.amount = amount;
      session.step = 'confirm';
      await saveSwapSession(userId, session);

      const summary = `
Swap Summary:
From: ${session.fromToken}
To: ${session.toToken}
Amount: ${session.amount}

Type 'confirm' to proceed with the swap or 'cancel' to start over.`;

      return {
        response: summary,
        step: 'confirm'
      };

    case 'confirm':
      if (input.toLowerCase() === 'confirm') {
        try {
          // Here you would implement the actual swap logic
          // For now, we'll just return a success message
          await clearSwapSession(userId);
          return {
            response: 'Swap initiated! You will need to sign a transaction to complete the process.',
            unsignedTransaction: 'YOUR_UNSIGNED_TRANSACTION_HERE' // Replace with actual transaction
          };
        } catch (error) {
          console.error('Error executing swap:', error);
          return {
            response: 'Failed to execute swap. Please try again.',
            step: 'confirm'
          };
        }
      } else if (input.toLowerCase() === 'cancel') {
        await clearSwapSession(userId);
        return {
          response: 'Swap cancelled. You can start over by typing "swap".'
        };
      } else {
        return {
          response: 'Please type "confirm" to proceed with the swap or "cancel" to start over.',
          step: 'confirm'
        };
      }

    default:
      return {
        response: 'Something went wrong. Please start over by typing "swap".'
      };
  }
} 
export interface ChatContext {
  walletAddress?: string;
  [key: string]: any;
}

export interface ChatResponse {
  response: string;
  step?: string;
  unsignedTransaction?: string;
  requireSignature?: boolean;
  swapDetails?: any;
}

export interface SwapSession {
  step: string | null;
  fromToken?: string;
  toToken?: string;
  amount?: number;
  validationErrorCount?: number;
  awaitingConfirmation?: boolean;
  [key: string]: any;
} 
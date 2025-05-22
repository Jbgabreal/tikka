export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  messages: ChatMessage[];
  walletAddress: string;
}

export interface TokenCreationSession {
  step: string | null;
  name?: string;
  symbol?: string;
  supply?: number;
  decimals?: number;
  description?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
  image?: string;
  awaitingConfirmation?: boolean;
  validationErrorCount?: number;
}

export interface SwapSession {
  step: string | null;
  fromToken?: string;
  toToken?: string;
  amount?: number;
  validationErrorCount?: number;
  awaitingConfirmation?: boolean;
}

export interface ChatResponse {
  response: string;
  unsignedTransaction?: string;
  prompt?: string;
  step?: string;
  error?: string;
}

export interface ChatHistory {
  history: Array<{
    message: string;
    response: string;
    timestamp: string;
  }>;
} 
export interface TokenCreationSession {
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
  [key: string]: any;
}

export interface FileUpload {
  buffer: Buffer;
  mimetype: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  size: number;
  stream: any;
  destination: string;
  filename: string;
  path: string;
} 
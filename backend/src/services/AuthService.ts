import jwt from 'jsonwebtoken';
import { UserModel, User, CreateUserData, LoginData } from '../models/UserSupabase';
import { WalletModel, CreateWalletData, ImportWalletData } from '../models/WalletSupabase';
import { ApiKeyModel, CreateApiKeyData } from '../models/ApiKeySupabase';
import { WalletService } from './WalletService';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_EXPIRES_IN = '7d';

  static async register(data: CreateUserData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Create user
      const user = await UserModel.createUser(data);
      
      // Create default wallet
      const wallet = await WalletModel.createWallet({
        userId: user.id,
        isImported: false
      });

      // Generate API key for Pump.fun (placeholder - you'll need to integrate with actual API)
      const pumpApiKey = await this.generatePumpApiKey();
      await ApiKeyModel.createApiKey({
        userId: user.id,
        service: 'pump',
        apiKey: pumpApiKey
      });

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  static async login(data: LoginData): Promise<AuthResult> {
    try {
      const user = await UserModel.findByEmail(data.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const isValidPassword = await UserModel.validatePassword(user, data.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const token = this.generateToken(user);

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  static async importWallet(userId: string, privateKey: string): Promise<{ success: boolean; wallet?: any; error?: string }> {
    try {
      const wallet = await WalletModel.importWallet({
        userId,
        privateKey
      });

      return {
        success: true,
        wallet
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import wallet'
      };
    }
  }

  static async getUserWallets(userId: string): Promise<any[]> {
    return await WalletService.getUserWallets(userId);
  }

  static async getUserApiKeys(userId: string): Promise<any[]> {
    return await ApiKeyModel.findByUserId(userId);
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private static async generatePumpApiKey(): Promise<string> {
    // This is a placeholder - you'll need to integrate with actual Pump.fun API
    // to generate real API keys
    return `pump_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}

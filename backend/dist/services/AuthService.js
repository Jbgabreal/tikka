"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Wallet_1 = require("../models/Wallet");
const ApiKey_1 = require("../models/ApiKey");
class AuthService {
    static async register(data) {
        try {
            // Check if user already exists
            const existingUser = await User_1.UserModel.findByEmail(data.email);
            if (existingUser) {
                return {
                    success: false,
                    error: 'User with this email already exists'
                };
            }
            // Create user
            const user = await User_1.UserModel.createUser(data);
            // Create default wallet
            const wallet = await Wallet_1.WalletModel.createWallet({
                userId: user.id,
                isImported: false
            });
            // Generate API key for Pump.fun (placeholder - you'll need to integrate with actual API)
            const pumpApiKey = await this.generatePumpApiKey();
            await ApiKey_1.ApiKeyModel.createApiKey({
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
        }
        catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'Registration failed. Please try again.'
            };
        }
    }
    static async login(data) {
        try {
            const user = await User_1.UserModel.findByEmail(data.email);
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            const isValidPassword = await User_1.UserModel.validatePassword(user, data.password);
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
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Login failed. Please try again.'
            };
        }
    }
    static async importWallet(userId, privateKey) {
        try {
            const wallet = await Wallet_1.WalletModel.importWallet({
                userId,
                privateKey
            });
            return {
                success: true,
                wallet
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import wallet'
            };
        }
    }
    static async getUserWallets(userId) {
        return await Wallet_1.WalletModel.findByUserId(userId);
    }
    static async getUserApiKeys(userId) {
        return await ApiKey_1.ApiKeyModel.findByUserId(userId);
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email
        }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    static async generatePumpApiKey() {
        // This is a placeholder - you'll need to integrate with actual Pump.fun API
        // to generate real API keys
        return `pump_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
AuthService.JWT_EXPIRES_IN = '7d';

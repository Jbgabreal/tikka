"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModel = void 0;
const uuid_1 = require("uuid");
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const crypto = __importStar(require("crypto"));
class WalletModel {
    static encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend IV to encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }
    static decrypt(encryptedText) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        // Split IV and encrypted data
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    static async createWallet(data) {
        const id = (0, uuid_1.v4)();
        const keypair = web3_js_1.Keypair.generate();
        const publicKey = keypair.publicKey.toString();
        const privateKey = bs58_1.default.encode(keypair.secretKey);
        const encryptedPrivateKey = this.encrypt(privateKey);
        const wallet = {
            id,
            userId: data.userId,
            publicKey,
            encryptedPrivateKey,
            isImported: data.isImported || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.wallets.set(id, wallet);
        return wallet;
    }
    static async importWallet(data) {
        const id = (0, uuid_1.v4)();
        // Validate the private key
        try {
            const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(data.privateKey));
            const publicKey = keypair.publicKey.toString();
            const encryptedPrivateKey = this.encrypt(data.privateKey);
            const wallet = {
                id,
                userId: data.userId,
                publicKey,
                encryptedPrivateKey,
                isImported: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.wallets.set(id, wallet);
            return wallet;
        }
        catch (error) {
            throw new Error('Invalid private key format');
        }
    }
    static async findByUserId(userId) {
        const userWallets = [];
        for (const wallet of this.wallets.values()) {
            if (wallet.userId === userId) {
                userWallets.push(wallet);
            }
        }
        return userWallets;
    }
    static async findById(id) {
        return this.wallets.get(id) || null;
    }
    static async getPrivateKey(walletId) {
        const wallet = this.wallets.get(walletId);
        if (!wallet)
            throw new Error('Wallet not found');
        return this.decrypt(wallet.encryptedPrivateKey);
    }
    static async getKeypair(walletId) {
        const privateKey = await this.getPrivateKey(walletId);
        return web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
    }
}
exports.WalletModel = WalletModel;
WalletModel.wallets = new Map();
WalletModel.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';

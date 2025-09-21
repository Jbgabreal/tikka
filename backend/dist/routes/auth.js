"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthService_1 = require("../services/AuthService");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Register endpoint
router.post('/register', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    const result = await AuthService_1.AuthService.register({ email, password });
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    res.status(201).json({
        message: 'User created successfully',
        user: {
            id: result.user.id,
            email: result.user.email,
            createdAt: result.user.createdAt
        },
        token: result.token
    });
}));
// Login endpoint
router.post('/login', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await AuthService_1.AuthService.login({ email, password });
    if (!result.success) {
        return res.status(401).json({ error: result.error });
    }
    res.json({
        message: 'Login successful',
        user: {
            id: result.user.id,
            email: result.user.email,
            createdAt: result.user.createdAt
        },
        token: result.token
    });
}));
// Import wallet endpoint
router.post('/import-wallet', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { privateKey } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!privateKey) {
        return res.status(400).json({ error: 'Private key is required' });
    }
    const result = await AuthService_1.AuthService.importWallet(userId, privateKey);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    res.json({
        message: 'Wallet imported successfully',
        wallet: {
            id: result.wallet.id,
            publicKey: result.wallet.publicKey,
            isImported: result.wallet.isImported
        }
    });
}));
// Get user wallets
router.get('/wallets', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const wallets = await AuthService_1.AuthService.getUserWallets(userId);
    res.json({
        wallets: wallets.map(wallet => ({
            id: wallet.id,
            publicKey: wallet.publicKey,
            isImported: wallet.isImported,
            createdAt: wallet.createdAt
        }))
    });
}));
// Get user API keys
router.get('/api-keys', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const apiKeys = await AuthService_1.AuthService.getUserApiKeys(userId);
    res.json({
        apiKeys: apiKeys.map(apiKey => ({
            id: apiKey.id,
            service: apiKey.service,
            createdAt: apiKey.createdAt
        }))
    });
}));
// Verify token endpoint
router.get('/verify', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
}));
exports.default = router;

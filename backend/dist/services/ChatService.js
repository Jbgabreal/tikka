"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const TokenPriceService_1 = require("./TokenPriceService");
const UserPortfolioService_1 = require("./UserPortfolioService");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
class ChatService {
    constructor() {
        this.tokenPriceService = new TokenPriceService_1.TokenPriceService();
        this.userPortfolioService = new UserPortfolioService_1.UserPortfolioService();
    }
    isPriceQuery(message) {
        const priceKeywords = [
            'price',
            'cost',
            'value',
            'worth',
            'how much',
            'current price',
            'latest price',
            'token price',
            'price of',
        ];
        const lowerMessage = message.toLowerCase();
        const result = priceKeywords.some(keyword => lowerMessage.includes(keyword));
        console.log('[isPriceQuery]', { message, result });
        return result;
    }
    isPortfolioQuery(message) {
        const portfolioKeywords = [
            'portfolio',
            'my tokens',
            'my coins',
            'what do i own',
            'show my tokens',
            'show my portfolio',
            'wallet tokens',
            'wallet coins',
            'my assets',
            'list my tokens',
            'list my coins',
            'get portfolio',
            'portfolio performance',
            'my portfolio performance',
            'profile tokens',
            'my profile tokens',
            'portfolio summary',
            'portfolio value',
            'portfolio balance',
            'portfolio overview',
            'token holdings',
            'show holdings',
            'get my tokens',
            'get my portfolio',
            'display my portfolio',
            'display my tokens',
            'portfolio report',
            'wallet performance',
            'wallet summary',
            'wallet value',
            'my balance',
            'what is my balance',
            'balance',
            'show balance',
            'wallet balance',
            'account balance',
            'solana balance',
            'sol balance',
            'how much do i have',
            'how much sol do i have',
            'how much is in my wallet',
            'how much money do i have',
            'how much crypto do i have',
            'how much are my tokens worth',
            'how much are my coins worth',
        ];
        const lowerMessage = message.toLowerCase();
        const result = portfolioKeywords.some(keyword => lowerMessage.includes(keyword));
        console.log('[isPortfolioQuery]', { message, result });
        return result;
    }
    isBotCapabilityQuery(message) {
        const triggers = [
            "what can you do",
            "how can you help",
            "what are your features",
            "what can you do for me",
            "how do i use you",
            "what is this",
            "who are you",
            "what can this bot do",
            "what can this assistant do",
            "what can solchatta do",
            "help me",
            "your capabilities",
            "your features"
        ];
        const lower = message.toLowerCase();
        return triggers.some(trigger => lower.includes(trigger));
    }
    isTrendingQuery(message) {
        const trendingKeywords = [
            'trending',
            "what's new",
            'what is new',
            'what is trending',
            'top tokens',
            'top projects',
            'top protocols',
            'top coins',
            'top solana',
            'best tokens',
            'best projects',
            'best protocols',
            'best coins',
            'what is hot',
            'what is popular',
            'what is moving',
            'what is pumping',
            'what is active',
            'what is up',
            'what is happening',
            'what is going on',
            'what is new on solana',
            'what is new in solana',
            'what is new in defi',
            'what is new in crypto',
            'what is new in tokens',
            'what is new in coins',
        ];
        const lowerMessage = message.toLowerCase();
        return trendingKeywords.some(keyword => lowerMessage.includes(keyword));
    }
    async chatWithOpenAI(message, context = {}) {
        console.log('[chatWithOpenAI] Received message:', message);
        // Special: Bot capability intent
        if (this.isBotCapabilityQuery(message)) {
            return {
                prompt: `🚀 **Welcome to Soltikka**\n\nYour AI-Powered Solana Assistant\n\nSoltikka empowers your crypto journey with powerful chat commands:\n\n🔄 **Token Swaps & Liquidity**\nEasily swap tokens and manage liquidity positions\n\n🎨 **Token Creation & Tracking**\nLaunch your own token or track existing collections\n\n📈 **Portfolio Monitoring**\nTrack your assets and get real-time price updates\n\n💬 **Natural Language DeFi**\nInteract with DeFi protocols using plain English\n\n**Quick Start Commands:**\n- "Create a token"\n- "Swap token"\n- "What is the price of BONK?"\n\n🔒 **Security First:** All actions require wallet confirmation. Soltikka never holds your funds.`
            };
        }
        // Portfolio query detection
        if (this.isPortfolioQuery(message)) {
            const walletAddress = context.walletAddress || (context.user && context.user.walletAddress);
            if (!walletAddress) {
                return { prompt: 'Please connect your wallet to view your portfolio.' };
            }
            console.log('[chatWithOpenAI] Routing to: portfolio service');
            const portfolioMsg = await this.userPortfolioService.formatPortfolioForChat(walletAddress);
            return { prompt: portfolioMsg };
        }
        // Price query detection
        if (this.isPriceQuery(message)) {
            try {
                console.log('[chatWithOpenAI] Routing to: price service');
                const priceResponse = await this.tokenPriceService.handlePriceQuery(message);
                return { prompt: priceResponse.prompt };
            }
            catch (error) {
                console.error('Error handling price query:', error);
                return { prompt: "Sorry, I couldn't fetch the price information at the moment. Please try again later." };
            }
        }
        // Trending/general intent detection
        if (this.isTrendingQuery(message)) {
            console.log('[chatWithOpenAI] Routing to: trending tokens (intent match)');
            // Simulate the same logic as the /api/chat/message trending intent
            // (You may want to refactor to call the same service as in your chat route)
            return { prompt: 'Here are the top trending tokens and protocols on Solana right now: ...' };
        }
        // If a custom system prompt is provided (e.g., degen personality), always use it and skip Solana keyword check
        if (context.systemPrompt) {
            const messages = [
                { role: 'system', content: context.systemPrompt },
                ...(context.messages || [])
                    .filter((m) => typeof m.content === 'string')
                    .map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ];
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages,
            });
            const content = completion.choices?.[0]?.message?.content || 'No response from assistant.';
            return { prompt: content };
        }
        // If the message is unrelated to Solana/SPL/DeFi, redirect politely (only if no custom system prompt)
        const solanaKeywords = ['solana', 'spl', 'defi', 'token', 'coin', 'protocol', 'wallet', 'nft', 'jupiter', 'pump.fun', 'magic eden', 'dex', 'solscan', 'blockchain', 'crypto'];
        const lowerMessage = message.toLowerCase();
        const isSolanaRelated = solanaKeywords.some(keyword => lowerMessage.includes(keyword));
        if (!isSolanaRelated) {
            return { prompt: "I'm here to help with Solana and SPL token questions. Ask me anything about Solana DeFi!" };
        }
        // Otherwise, always answer in the context of Solana/SPL/DeFi
        console.log('[chatWithOpenAI] Routing to: general chat (OpenAI, Solana context)');
        const systemPrompt = `You are Soltikka, an expert Solana DeFi chatbot. You only answer questions about the Solana blockchain, SPL tokens, Solana DeFi, and the Solana ecosystem (WCO = whole crypto ecosystem on Solana). If a user asks a general or ambiguous question (such as 'what is trending' or 'what's new'), always assume they are referring to the Solana ecosystem and respond with information relevant to Solana tokens, protocols, news, or trends. If a question is completely unrelated to Solana, politely redirect the user to ask about Solana or SPL tokens. Never answer questions outside the Solana/SPL/DeFi domain. Always interpret general questions as Solana-related. All your answers must be strictly about Solana, SPL tokens, Solana DeFi, or the Solana ecosystem (WCO).`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(context.messages || [])
                .filter((m) => typeof m.content === 'string')
                .map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
        });
        const content = completion.choices?.[0]?.message?.content || 'No response from assistant.';
        return { prompt: content };
    }
    async chatWithDeepSeek(message, context = {}) {
        console.log('[chatWithDeepSeek] Received message:', message);
        // Portfolio query detection
        if (this.isPortfolioQuery(message)) {
            // Try to get wallet address from context
            const walletAddress = context.walletAddress || (context.user && context.user.walletAddress);
            if (!walletAddress) {
                return { prompt: 'Please connect your wallet to view your portfolio.' };
            }
            console.log('[chatWithDeepSeek] Routing to: portfolio service');
            const portfolioMsg = await this.userPortfolioService.formatPortfolioForChat(walletAddress);
            return { prompt: portfolioMsg };
        }
        // Price query detection
        if (this.isPriceQuery(message)) {
            try {
                console.log('[chatWithDeepSeek] Routing to: price service');
                const priceResponse = await this.tokenPriceService.handlePriceQuery(message);
                return { prompt: priceResponse.prompt };
            }
            catch (error) {
                console.error('Error handling price query:', error);
                // Fall back to DeepSeek if price query fails
                return { prompt: "Sorry, I couldn't fetch the price information at the moment. Please try again later." };
            }
        }
        console.log('[chatWithDeepSeek] Routing to: general chat');
        // If not a price or portfolio query, use DeepSeek
        const apiKey = process.env.DEEPSEEK_API_KEY;
        const response = await axios_1.default.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                ...(context.messages || []),
                { role: 'user', content: message }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        // Always wrap DeepSeek response in prompt structure
        const content = response.data.choices?.[0]?.message?.content || 'No response from assistant.';
        return { prompt: content };
    }
}
exports.ChatService = ChatService;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendingService = void 0;
const axios_1 = __importDefault(require("axios"));
class TrendingService {
    async getTrending(limit = 10) {
        const url = 'https://api.dexscreener.com/latest/dex/tokens/trending';
        const response = await axios_1.default.get(url);
        return response.data.pairs?.slice(0, limit) || [];
    }
}
exports.TrendingService = TrendingService;

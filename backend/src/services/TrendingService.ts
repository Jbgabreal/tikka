import axios from 'axios';

export class TrendingService {
  async getTrending(limit = 10) {
    const url = 'https://api.dexscreener.com/latest/dex/tokens/trending';
    const response = await axios.get(url);
    return response.data.pairs?.slice(0, limit) || [];
  }
} 
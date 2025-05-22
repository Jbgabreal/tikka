import axios from 'axios';

export class TokenPriceService {
  async getPrice(tokenAddress: string) {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const response = await axios.get(url);
    return response.data;
  }
} 
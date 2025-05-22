import axios from 'axios';

/**
 * Get token price from DexScreener by mint address
 * @param mintAddress The token mint address
 * @returns The price in USD or null if not found
 */
export async function getDexScreenerPrice(mintAddress: string): Promise<number | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;
    const res = await axios.get(url);
    if (res.data && res.data.pairs && res.data.pairs.length > 0) {
      const price = parseFloat(res.data.pairs[0].priceUsd);
      return isNaN(price) ? null : price;
    }
    return null;
  } catch (err: any) {
    console.error('DexScreener price fetch failed:', err.message);
    return null;
  }
} 
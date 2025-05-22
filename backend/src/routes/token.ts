import { Router } from 'express';
import { TokenPriceService } from '../services/TokenPriceService';
import { TokenCreationService } from '../services/TokenCreationService';
import { TokenSwapService } from '../services/TokenSwapService';
import { TrendingService } from '../services/TrendingService';

const router = Router();
const priceService = new TokenPriceService();
const creationService = new TokenCreationService();
const swapService = new TokenSwapService();
const trendingService = new TrendingService();

router.post('/price', async (req, res) => {
  const { tokenAddress } = req.body;
  try {
    const price = await priceService.getPrice(tokenAddress);
    res.json(price);
  } catch (error) {
    res.status(500).json({ error: 'Token price error', details: error?.toString() });
  }
});

router.post('/create', async (req, res) => {
  try {
    const result = await creationService.createToken(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Token creation error', details: error?.toString() });
  }
});

router.post('/swap', async (req, res) => {
  try {
    const result = await swapService.swapToken(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Token swap error', details: error?.toString() });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const trending = await trendingService.getTrending(limit);
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: 'Trending error', details: error?.toString() });
  }
});

export default router; 
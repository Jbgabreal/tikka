import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { initiateBridge, getBridgeStatus } from '../services/bridge';

const router = Router();

// Schema for bridge request
const bridgeRequestSchema = z.object({
  sourceChain: z.string(),
  targetChain: z.string(),
  token: z.string(),
  amount: z.number().positive(),
  recipient: z.string()
});

/**
 * @route POST /api/bridge/transfer
 * @desc Initiate a cross-chain transfer
 * @access Private
 */
router.post('/transfer', validateRequest({ body: bridgeRequestSchema }), async (req, res) => {
  try {
    const { sourceChain, targetChain, token, amount, recipient } = req.body;
    const bridgeTx = await initiateBridge({
      sourceChain,
      targetChain,
      token,
      amount,
      recipient
    });
    res.json({ transactionId: bridgeTx.id, status: bridgeTx.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate bridge transfer' });
  }
});

/**
 * @route GET /api/bridge/status/:txId
 * @desc Get status of a bridge transfer
 * @access Private
 */
router.get('/status/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const status = await getBridgeStatus(txId);
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bridge status' });
  }
});

export default router; 
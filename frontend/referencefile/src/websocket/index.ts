import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Connection } from '@solana/web3.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

// WebSocket server instance
let wss: WebSocketServer;

// Connected clients
const clients = new Map<string, WebSocket>();

// Initialize WebSocket server
export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = req.headers['sec-websocket-key'] as string;
    clients.set(clientId, ws);

    console.log(`Client connected: ${clientId}`);

    // Handle client messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe':
            handleSubscription(clientId, data);
            break;
          case 'unsubscribe':
            handleUnsubscription(clientId, data);
            break;
          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    });
  });

  // Start listening for Solana events
  startSolanaListener();
}

// Handle client subscription
function handleSubscription(clientId: string, data: any) {
  const ws = clients.get(clientId);
  if (!ws) return;

  switch (data.channel) {
    case 'token_price':
      // Subscribe to token price updates
      break;
    case 'swap_events':
      // Subscribe to swap events
      break;
    default:
      console.warn(`Unknown subscription channel: ${data.channel}`);
  }
}

// Handle client unsubscription
function handleUnsubscription(clientId: string, data: any) {
  // Remove client from specific subscription
  console.log(`Client ${clientId} unsubscribed from ${data.channel}`);
}

// Start listening for Solana events
function startSolanaListener() {
  // Subscribe to program account changes
  const programId = process.env.RAYDIUM_PROGRAM_ID;
  if (!programId) {
    console.warn('Raydium program ID not configured');
    return;
  }

  connection.onProgramAccountChange(
    new PublicKey(programId),
    (accountInfo, context) => {
      // Broadcast swap events to subscribed clients
      broadcastSwapEvent(accountInfo, context);
    }
  );
}

// Broadcast swap event to subscribed clients
function broadcastSwapEvent(accountInfo: any, context: any) {
  const message = JSON.stringify({
    type: 'swap_event',
    data: {
      slot: context.slot,
      accountInfo
    }
  });

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Broadcast token price update
export function broadcastTokenPrice(symbol: string, price: number) {
  const message = JSON.stringify({
    type: 'token_price',
    data: {
      symbol,
      price,
      timestamp: Date.now()
    }
  });

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
} 
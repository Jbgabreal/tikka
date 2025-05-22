import express from 'express';
import { createServer } from 'http';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { setupWebSocket } from './websocket/index.js';
import { setupCronJobs } from './cron/index.js';
import { initializeTokenMap } from './services/tokenMapping.js';
import { initializeTokenMetadata } from './services/raydium.js';
import { connectRedis } from './redis/index.js';
import cors from 'cors';
import { initializeCronJobs } from './services/cron.js';

// Routes
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import tokenRoutes from './routes/token.js';
import solanaRoutes from './routes/solana.js';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize cron jobs
initializeCronJobs();

// Routes
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/solana', solanaRoutes);

// Error handling
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Start server
async function startServer() {
  try {
    await connectRedis();
    console.log('Starting server initialization...');
    
    // Setup WebSocket server
    setupWebSocket(httpServer);
    
    // Setup cron jobs
    setupCronJobs();
    
    // Initialize token maps
    await Promise.all([
      initializeTokenMap(),
      initializeTokenMetadata()
    ]);
    console.log('Token services initialized');
    
    // Start server
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
import express from 'express';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import tokenRoutes from './routes/token';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(express.json());
const corsOrigin = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use('/api/chat', chatRoutes);
app.use('/api/token', tokenRoutes);

export default app; 
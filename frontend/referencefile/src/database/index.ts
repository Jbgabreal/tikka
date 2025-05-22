import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

// Create database connection pool
export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'solana_chat',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000 // How long to wait for a connection
});

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    throw error;
  }
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Read and execute schema.sql
    const fs = await import('fs/promises');
    const path = await import('path');
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('Database schema initialized successfully');
    
    client.release();
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}

// Export database query helper
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
} 
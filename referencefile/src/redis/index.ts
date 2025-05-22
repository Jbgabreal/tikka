import { createClient } from 'redis';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Redis client
export const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD
});

// Connect to Redis
export async function connectRedis() {
  try {
    await redis.connect();
    console.log('Successfully connected to Redis');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    throw error;
  }
}

// Rate limiting middleware
export async function checkRateLimit(ip: string, limit: number, window: number): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    return current <= limit;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow request if Redis is down
  }
}

// Cache token price
export async function cacheTokenPrice(symbol: string, price: number, ttl: number = 300): Promise<void> {
  const key = `token:price:${symbol}`;
  try {
    await redis.set(key, price.toString(), { EX: ttl });
  } catch (error) {
    console.error('Error caching token price:', error);
  }
}

// Get cached token price
export async function getCachedTokenPrice(symbol: string): Promise<number | null> {
  const key = `token:price:${symbol}`;
  try {
    const price = await redis.get(key);
    if (price) {
      console.log(`[Redis] CACHE HIT (token price): ${key}`);
      return parseFloat(price);
    } else {
      console.log(`[Redis] CACHE MISS (token price): ${key}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting cached token price:', error);
    return null;
  }
}

// Generic set cache helper
export async function setCache(key: string, value: any, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttl });
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

// Generic get cache helper
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

// Chat response cache helpers
export async function cacheChatResponse(question: string, response: string, ttl: number = 3600): Promise<void> {
  const key = `chat:response:${question.trim().toLowerCase()}`;
  await setCache(key, response, ttl);
}

export async function getCachedChatResponse(question: string): Promise<string | null> {
  const key = `chat:response:${question.trim().toLowerCase()}`;
  const val = await getCache<string>(key);
  if (val) {
    console.log(`[Redis] CACHE HIT (chat response): ${key}`);
  } else {
    console.log(`[Redis] CACHE MISS (chat response): ${key}`);
  }
  return val;
}

// Token creation session helpers
export async function setTokenCreationSession(userId: string, data: any, ttl: number = 1800): Promise<void> {
  const key = `token_creation:${userId}`;
  await setCache(key, data, ttl);
}

export async function getTokenCreationSession(userId: string): Promise<any | null> {
  const key = `token_creation:${userId}`;
  return await getCache<any>(key);
}

export async function clearTokenCreationSession(userId: string): Promise<void> {
  const key = `token_creation:${userId}`;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error clearing token creation session:', error);
  }
}

// Swap session helpers
export async function setSwapSession(userId: string, data: any, ttl: number = 1800): Promise<void> {
  const key = `swap_session:${userId}`;
  await setCache(key, data, ttl);
}

export async function getSwapSession(userId: string): Promise<any | null> {
  const key = `swap_session:${userId}`;
  return await getCache<any>(key);
}

export async function clearSwapSession(userId: string): Promise<void> {
  const key = `swap_session:${userId}`;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error clearing swap session:', error);
  }
}

// Close Redis connection
export async function closeRedis() {
  try {
    await redis.quit();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
} 
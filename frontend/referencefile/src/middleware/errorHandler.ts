import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(error => ({
        path: error.path.join('.'),
        message: error.message
      }))
    });
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: 'error'
    });
  }

  // Handle Solana Web3 errors
  if (err.name === 'SolanaError') {
    return res.status(400).json({
      error: 'Solana transaction error',
      details: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      status: 'error'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      status: 'error'
    });
  }

  // Handle database errors
  if (err.name === 'PostgresError') {
    return res.status(500).json({
      error: 'Database error',
      status: 'error'
    });
  }

  // Handle Redis errors
  if (err.name === 'RedisError') {
    return res.status(500).json({
      error: 'Cache error',
      status: 'error'
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: 'Internal server error',
    status: 'error'
  });
}

// Not found middleware
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not found',
    status: 'error'
  });
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: err.meta?.target
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

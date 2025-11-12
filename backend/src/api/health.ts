import { Request, Response } from 'express';

export function healthCheck(req: Request, res: Response): void {
  res.json({ status: 'ok', timestamp: Date.now() });
}


import { Request, Response, NextFunction } from 'express'
import { verifyToken } from './auth'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = payload
  next()
}

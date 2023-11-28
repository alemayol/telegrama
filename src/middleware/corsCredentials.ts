import { Response, Request, NextFunction } from 'express'

export function corsCredentials (req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin

  if (origin === 'http://localhost:5173') {
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  next()
}

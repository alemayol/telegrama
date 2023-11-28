import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

export const notFound: RequestHandler = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    ok: false,
    message: 'Route does not exist'
  })
}

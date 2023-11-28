import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ErrorHandler } from '../types/Types'

import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../types/Classes'

export const errorHandlerMiddleware: ErrorRequestHandler = (error: CustomError, req: Request, res: Response, _next: NextFunction) => {
  const customError: ErrorHandler = {
    message: error.message,
    status: error.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
    ok: false
  }

  if (error.name === 'CastError') {
    // customError.message = Object.values(error).map((item) => item)
    customError.status = StatusCodes.NOT_FOUND
  }

  if (error.name === 'ValidationError') {
    customError.message = Object.values(error).map((item) => item)
    customError.status = StatusCodes.BAD_REQUEST
  }

  return res.status(customError.status).json(customError)
}

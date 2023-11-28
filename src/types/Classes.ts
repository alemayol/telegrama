import { StatusCodes } from 'http-status-codes'

export class CustomError extends Error {
  constructor (public message: string, public status: StatusCodes) {
    super(message)
    this.status = status
  }
}

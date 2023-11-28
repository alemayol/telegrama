import { NextFunction, Request, Response } from 'express'
import { CustomError } from '../types/Classes'
import { StatusCodes } from 'http-status-codes'
import User from '../models/User'
import Conversations from '../models/Conversations'

export async function checkActiveSession (req: Request, res: Response, next: NextFunction): Promise<unknown> {
  const session = req.session

  try {
    if (session == null || session.user == null) {
      session.destroy((err) => {
        if (err instanceof Error || Boolean(err)) {
          return res.clearCookie('connect.sid', {
            path: '/'
          }).send('cleared cookie')
        }
      })

      throw new CustomError('No Credentials Provided', StatusCodes.UNAUTHORIZED)
    }

    const user = await User.findById(session.user._id).select('-password -createdAt -updatedAt -__V')

    if (user == null) {
      throw new CustomError('Invalid Credenditials', StatusCodes.UNAUTHORIZED)
    }

    const userConversations = await Conversations.find({ 'participants._id': user?._id }).select('-__v -updatedAt')

    return { ok: true, user, conversations: userConversations }
  } catch (error) {
    next(error)
  }
}
